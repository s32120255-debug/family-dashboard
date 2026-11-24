package kr.kmsysh.sihunlock

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.util.DisplayMetrics
import android.view.Display
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalTime
import java.util.concurrent.TimeUnit

/**
 * 일정을 읽어 잠금화면 배경을 다시 그려요. 알림은 전혀 쓰지 않아요.
 * - 15분마다(안드로이드가 허락하는 가장 짧은 주기)
 * - 일정이 시작·끝나는 시각에 한 번 더(지금 칸이 바로 바뀌도록)
 */
class LockWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val ctx = applicationContext
        val auth = Auth(ctx)
        if (!auth.signedIn) return@withContext Result.success()
        runCatching { Updater.run(ctx, auth) }
        Result.success()
    }
}

object Updater {
    /** 화면에 그릴 것 계산 → 바뀌었을 때만 잠금화면 설정. 미리보기 그림을 돌려줘요. */
    fun run(ctx: Context, auth: Auth, force: Boolean = false): Bitmap? {
        var fetchedOk = true
        try {
            val token = auth.idToken()
            Cache.save(ctx, Firestore.list("schedule", token), Firestore.list("schedOverrides", token))
        } catch (e: Exception) {
            fetchedOk = false
            ctx.getSharedPreferences("state", Context.MODE_PRIVATE).edit().putString("lastError", e.message?.take(200)).apply()
        }
        val (schedule, overrides, at) = Cache.load(ctx) ?: return null
        val today = LocalDate.now()
        val nm = nowMinutes()
        val items = itemsFor(today, schedule, overrides)
        val nn = nowNext(items, nm)
        val atT = java.time.Instant.ofEpochMilli(at).atZone(java.time.ZoneId.systemDefault())
        val footer = (if (fetchedOk) "" else "인터넷이 안 돼서 ") +
            "${ampm("%02d:%02d".format(atT.hour, atT.minute))} 일정 기준" +
            (if (atT.toLocalDate() != today) " (${atT.monthValue}/${atT.dayOfMonth})" else "")

        // 같은 그림이면 다시 설정하지 않아요(깜빡임·배터리 아끼기)
        val pastCount = items.count { it.e != null && nm >= it.e!! }
        val key = listOf(today, items, nn.now, nn.next, pastCount, footer).toString()
        val st = ctx.getSharedPreferences("state", Context.MODE_PRIVATE)
        if (!force && st.getString("key", null) == key) {
            scheduleBoundary(ctx, nextBoundary(items, nm)); return null
        }

        val (w, h) = screenSize(ctx)
        val bmp = Renderer.render(ctx, w, h, Scene(today, items, nm, footer))
        WallpaperManager.getInstance(ctx).setBitmap(bmp, null, true, WallpaperManager.FLAG_LOCK)
        st.edit().putString("key", key).putLong("setAt", System.currentTimeMillis()).apply()
        scheduleBoundary(ctx, nextBoundary(items, nm)) // 맨 마지막에(지금 도는 작업이 취소돼도 이미 끝난 뒤)
        return bmp
    }

    fun screenSize(ctx: Context): Pair<Int, Int> {
        val dm = DisplayMetrics()
        @Suppress("DEPRECATION")
        (ctx.getSystemService(DisplayManager::class.java).getDisplay(Display.DEFAULT_DISPLAY)).getRealMetrics(dm)
        val a = minOf(dm.widthPixels, dm.heightPixels).coerceAtLeast(720)
        val b = maxOf(dm.widthPixels, dm.heightPixels).coerceAtLeast(1280)
        return a to b
    }

    private val net = Constraints.Builder().setRequiredNetworkType(NetworkType.NOT_REQUIRED).build()

    fun startPeriodic(ctx: Context) {
        val req = PeriodicWorkRequestBuilder<LockWorker>(15, TimeUnit.MINUTES).setConstraints(net).build()
        WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("lock-periodic", ExistingPeriodicWorkPolicy.KEEP, req)
    }

    /** 다음 일정 시작/끝 시각(없으면 자정 직후)에 한 번 더 그리기 */
    fun scheduleBoundary(ctx: Context, boundary: Int?) {
        val now = LocalTime.now()
        val nowSec = now.toSecondOfDay()
        val targetSec = (boundary ?: (24 * 60)) * 60 + 5
        val delay = (targetSec - nowSec).coerceAtLeast(30).toLong()
        val req = OneTimeWorkRequestBuilder<LockWorker>().setInitialDelay(delay, TimeUnit.SECONDS).setConstraints(net).build()
        WorkManager.getInstance(ctx).enqueueUniqueWork("lock-boundary", ExistingWorkPolicy.REPLACE, req)
    }

    fun stopAll(ctx: Context) {
        WorkManager.getInstance(ctx).cancelUniqueWork("lock-periodic")
        WorkManager.getInstance(ctx).cancelUniqueWork("lock-boundary")
        ctx.getSharedPreferences("state", Context.MODE_PRIVATE).edit().clear().apply()
        runCatching { WallpaperManager.getInstance(ctx).clear(WallpaperManager.FLAG_LOCK) }
    }
}
