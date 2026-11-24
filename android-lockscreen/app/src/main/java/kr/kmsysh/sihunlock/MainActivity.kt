package kr.kmsysh.sihunlock

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var auth: Auth
    private lateinit var font: Typeface
    private lateinit var status: TextView
    private lateinit var msg: TextView
    private lateinit var loginBtn: Button
    private lateinit var nowBtn: Button
    private lateinit var stopBtn: Button
    private lateinit var preview: ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        auth = Auth(this)
        font = Typeface.createFromAsset(assets, "fonts/YeonSung-Regular.ttf")
        val dp = resources.displayMetrics.density
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((20 * dp).toInt(), (28 * dp).toInt(), (20 * dp).toInt(), (28 * dp).toInt())
        }
        fun tv(size: Float, color: String) = TextView(this).apply { typeface = font; textSize = size; setTextColor(Color.parseColor(color)); setPadding(0, (6 * dp).toInt(), 0, (6 * dp).toInt()) }
        fun btn(label: String, bg: String, fg: String = "#14141c") = Button(this).apply {
            text = label; typeface = font; textSize = 20f; isAllCaps = false; setTextColor(Color.parseColor(fg))
            background = GradientDrawable().apply { setColor(Color.parseColor(bg)); cornerRadius = 16 * dp; setStroke((2 * dp).toInt(), Color.BLACK) }
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (56 * dp).toInt()).apply { topMargin = (12 * dp).toInt() }
        }
        col.addView(tv(30f, "#ecebf3").apply { text = "시훈 잠금화면" })
        status = tv(17f, "#9a99ad"); col.addView(status)
        loginBtn = btn("구글로 로그인 (시훈이 계정)", "#ffd34d"); col.addView(loginBtn)
        nowBtn = btn("지금 잠금화면 바꾸기", "#3dd9a8"); col.addView(nowBtn)
        msg = tv(17f, "#ecebf3"); col.addView(msg)
        preview = ImageView(this).apply {
            adjustViewBounds = true; visibility = View.GONE
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = (12 * dp).toInt() }
        }
        col.addView(preview)
        col.addView(tv(15f, "#9a99ad").apply {
            text = "일정이 바뀌면 보통 15분 안에 잠금화면도 바뀌어요. 일정이 시작하고 끝나는 시각에도 다시 그려요. 알림은 쓰지 않아요."
        })
        stopBtn = btn("그만 쓰기 (원래 잠금화면으로)", "#2a2a38", "#ecebf3"); col.addView(stopBtn)
        setContentView(ScrollView(this).apply { setBackgroundColor(Color.parseColor("#14141c")); addView(col) })

        loginBtn.setOnClickListener { if (auth.signedIn) { Updater.stopAll(this); auth.signOut(); refresh(); msg.text = "로그아웃했어요." } else signIn() }
        nowBtn.setOnClickListener { updateNow() }
        stopBtn.setOnClickListener { Updater.stopAll(this); preview.visibility = View.GONE; msg.text = "멈췄어요. 잠금화면이 원래 배경으로 돌아가요. 다시 쓰려면 「지금 잠금화면 바꾸기」를 눌러요." }
        refresh()
        if (auth.signedIn) Updater.startPeriodic(this)
    }

    private fun refresh() {
        status.text = if (auth.signedIn) "로그인: ${auth.email}" else "로그인이 필요해요."
        loginBtn.text = if (auth.signedIn) "로그아웃" else "구글로 로그인 (시훈이 계정)"
        nowBtn.isEnabled = auth.signedIn; nowBtn.alpha = if (auth.signedIn) 1f else .4f
    }

    private fun signIn() {
        msg.text = "로그인하는 중…"
        lifecycleScope.launch {
            try {
                val req = GetCredentialRequest.Builder()
                    .addCredentialOption(GetSignInWithGoogleOption.Builder(Fb.WEB_CLIENT_ID).build()).build()
                val res = CredentialManager.create(this@MainActivity).getCredential(this@MainActivity, req)
                val c = res.credential
                if (c !is CustomCredential || c.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) throw IllegalStateException("구글 계정 정보가 아니에요")
                val idToken = GoogleIdTokenCredential.createFrom(c.data).idToken
                withContext(Dispatchers.IO) { auth.signInWithGoogle(idToken) }
                refresh(); msg.text = "로그인했어요."
                Updater.startPeriodic(this@MainActivity)
                updateNow()
            } catch (e: GetCredentialCancellationException) {
                msg.text = "로그인을 취소했어요."
            } catch (e: Exception) {
                msg.text = "로그인하지 못했어요.\n[${e.javaClass.simpleName}: ${e.message?.take(200)}]"
            }
        }
    }

    private fun updateNow() {
        msg.text = "일정을 읽고 그리는 중…"
        lifecycleScope.launch {
            try {
                val bmp: Bitmap? = withContext(Dispatchers.IO) { Updater.run(this@MainActivity, auth, force = true) }
                Updater.startPeriodic(this@MainActivity)
                if (bmp == null) {
                    val err = getSharedPreferences("state", MODE_PRIVATE).getString("lastError", null)
                    msg.text = "일정을 읽지 못했어요.\n[${err ?: "알 수 없음"}]"
                } else {
                    preview.setImageBitmap(bmp); preview.visibility = View.VISIBLE
                    msg.text = "잠금화면을 바꿨어요. 화면을 껐다 켜서 확인해 보세요."
                }
            } catch (e: Exception) {
                msg.text = "잠금화면을 바꾸지 못했어요.\n[${e.javaClass.simpleName}: ${e.message?.take(200)}]"
            }
        }
    }
}
