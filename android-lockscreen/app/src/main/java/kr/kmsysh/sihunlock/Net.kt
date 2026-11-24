package kr.kmsysh.sihunlock

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/** 웹앱과 같은 Firebase 프로젝트(kmsysh-fa740). 공개돼도 괜찮은 값(보안은 Firestore 규칙). */
object Fb {
    const val API_KEY = "AIzaSyAsQxKpizqbWf0OzIKbUtWAoLsvK2zZRMs"
    const val PROJECT = "kmsysh-fa740"
    /** Firebase 구글 로그인의 웹 클라이언트 ID */
    const val WEB_CLIENT_ID = "36140585172-rjfjma9ssipjkakvak9v2nil8buusg3n.apps.googleusercontent.com"
}

class HttpError(val code: Int, body: String) : Exception("HTTP $code: ${body.take(300)}")

private fun http(url: String, method: String = "GET", body: String? = null, type: String = "application/json", token: String? = null): JSONObject {
    val c = URL(url).openConnection() as HttpURLConnection
    c.requestMethod = method
    c.connectTimeout = 15000; c.readTimeout = 20000
    if (token != null) c.setRequestProperty("Authorization", "Bearer $token")
    if (body != null) {
        c.doOutput = true
        c.setRequestProperty("Content-Type", type)
        c.outputStream.use { it.write(body.toByteArray()) }
    }
    val code = c.responseCode
    val text = (if (code in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
    if (code !in 200..299) throw HttpError(code, text)
    return JSONObject(text.ifBlank { "{}" })
}

/** 로그인 정보는 이 폰 안(SharedPreferences)에만 둬요. */
class Auth(ctx: Context) {
    private val p = ctx.getSharedPreferences("auth", Context.MODE_PRIVATE)
    val email: String? get() = p.getString("email", null)
    val signedIn: Boolean get() = p.getString("refresh", null) != null

    /** 구글 ID 토큰 → Firebase 로그인(웹앱과 같은 계정) */
    fun signInWithGoogle(googleIdToken: String) {
        val r = http(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${Fb.API_KEY}", "POST",
            JSONObject()
                .put("postBody", "id_token=$googleIdToken&providerId=google.com")
                .put("requestUri", "http://localhost")
                .put("returnSecureToken", true)
                .put("returnIdpCredential", true).toString()
        )
        save(r.getString("idToken"), r.getString("refreshToken"), r.optString("expiresIn", "3600").toLong())
        p.edit().putString("email", r.optString("email")).apply()
    }

    private fun save(id: String, refresh: String, expiresIn: Long) {
        p.edit().putString("id", id).putString("refresh", refresh)
            .putLong("exp", System.currentTimeMillis() + (expiresIn - 120) * 1000).apply()
    }

    /** 1시간마다 끝나는 토큰을 새로 받아요. */
    fun idToken(): String {
        val id = p.getString("id", null)
        if (id != null && System.currentTimeMillis() < p.getLong("exp", 0)) return id
        val refresh = p.getString("refresh", null) ?: throw IllegalStateException("로그인 안 됨")
        val r = http(
            "https://securetoken.googleapis.com/v1/token?key=${Fb.API_KEY}", "POST",
            "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(refresh, "UTF-8"),
            "application/x-www-form-urlencoded"
        )
        save(r.getString("id_token"), r.getString("refresh_token"), r.optString("expires_in", "3600").toLong())
        return r.getString("id_token")
    }

    fun signOut() = p.edit().clear().apply()
}

object Firestore {
    /** 컬렉션 전체 읽기(읽기만, 쓰지 않음) */
    fun list(collection: String, token: String): List<Doc> {
        val out = mutableListOf<Doc>()
        var page: String? = null
        do {
            var url = "https://firestore.googleapis.com/v1/projects/${Fb.PROJECT}/databases/(default)/documents/$collection?pageSize=300"
            if (page != null) url += "&pageToken=" + URLEncoder.encode(page, "UTF-8")
            val r = http(url, token = token)
            val docs = r.optJSONArray("documents") ?: JSONArray()
            for (i in 0 until docs.length()) {
                val d = docs.getJSONObject(i)
                val m = mutableMapOf<String, Any?>("id" to d.getString("name").substringAfterLast('/'))
                val f = d.optJSONObject("fields")
                if (f != null) for (k in f.keys()) m[k] = value(f.getJSONObject(k))
                out += m
            }
            page = r.optString("nextPageToken").ifBlank { null }
        } while (page != null)
        return out
    }

    private fun value(v: JSONObject): Any? = when {
        v.has("stringValue") -> v.getString("stringValue")
        v.has("booleanValue") -> v.getBoolean("booleanValue")
        v.has("integerValue") -> v.getString("integerValue").toLongOrNull()
        v.has("doubleValue") -> v.getDouble("doubleValue")
        v.has("timestampValue") -> v.getString("timestampValue")
        else -> null
    }
}

/** 마지막으로 받은 일정(인터넷이 잠깐 안 될 때 이걸로 그림) */
object Cache {
    private fun enc(l: List<Doc>) = JSONArray(l.map { JSONObject(it.filterValues { v -> v != null }) }).toString()
    private fun dec(s: String?): List<Doc> {
        if (s == null) return emptyList()
        val a = JSONArray(s)
        return (0 until a.length()).map { i -> val o = a.getJSONObject(i); o.keys().asSequence().associateWith { o.get(it) } }
    }
    fun save(ctx: Context, schedule: List<Doc>, overrides: List<Doc>) {
        ctx.getSharedPreferences("cache", Context.MODE_PRIVATE).edit()
            .putString("schedule", enc(schedule)).putString("overrides", enc(overrides))
            .putLong("at", System.currentTimeMillis()).apply()
    }
    fun load(ctx: Context): Triple<List<Doc>, List<Doc>, Long>? {
        val p = ctx.getSharedPreferences("cache", Context.MODE_PRIVATE)
        if (!p.contains("at")) return null
        return Triple(dec(p.getString("schedule", null)), dec(p.getString("overrides", null)), p.getLong("at", 0))
    }
}
