package kr.kmsysh.sihunlock

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.text.TextUtils
import android.text.TextPaint
import java.time.LocalDate

/** 시훈이 대시보드(sihun-board)와 같은 어두운 닌자 고양이 색 */
private object C {
    val BG = Color.parseColor("#14141c")
    val GRID = Color.parseColor("#1a1a24")
    val CARD = Color.parseColor("#1e1e2a")
    val FG = Color.parseColor("#ecebf3")
    val MUTED = Color.parseColor("#9a99ad")
    val LINE = Color.parseColor("#3a3a4e")
    val RED = Color.parseColor("#ff4d5e")
    val INK = Color.parseColor("#14141c")
    val SHADOW = Color.parseColor("#0b0b10")
    val PAL = listOf("#ffd34d", "#6fa8ff", "#ff7a8a", "#3dd9a8", "#b48cff", "#8fd14f").map { Color.parseColor(it) }
}

class Scene(
    val date: LocalDate,
    val items: List<Item>,
    val nm: Int,
    /** 아래에 작게: "오후 3:05 업데이트" */
    val footer: String,
)

object Renderer {
    private const val DOW = "월화수목금토일"

    fun render(ctx: Context, w: Int, h: Int, sc: Scene): Bitmap {
        val font = Typeface.createFromAsset(ctx.assets, "fonts/YeonSung-Regular.ttf")
        val cat = BitmapFactory.decodeResource(ctx.resources, R.drawable.ninja)
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val cv = Canvas(bmp)
        val u = w / 1080f
        fun tp(size: Float, color: Int) = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { typeface = font; textSize = size * u; this.color = color }
        val fill = Paint(Paint.ANTI_ALIAS_FLAG)
        val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }

        // 바탕 + 모눈
        cv.drawColor(C.BG)
        fill.color = C.GRID; fill.strokeWidth = 2f * u
        val g = 42 * u
        var x = 0f; while (x < w) { cv.drawLine(x, 0f, x, h.toFloat(), fill); x += g }
        var yy = 0f; while (yy < h) { cv.drawLine(0f, yy, w.toFloat(), yy, fill); yy += g }

        val L = 64 * u; val R = w - 64 * u
        fun card(r: RectF, border: Int, bw: Float = 5f) {
            fill.color = C.SHADOW; cv.drawRoundRect(RectF(r.left, r.top + 10 * u, r.right, r.bottom + 10 * u), 40 * u, 40 * u, fill)
            fill.color = C.CARD; cv.drawRoundRect(r, 40 * u, 40 * u, fill)
            stroke.color = border; stroke.strokeWidth = bw * u; cv.drawRoundRect(r, 40 * u, 40 * u, stroke)
        }
        fun text(s: String, p: TextPaint, x0: Float, y0: Float, maxW: Float) {
            cv.drawText(TextUtils.ellipsize(s, p, maxW, TextUtils.TruncateAt.END).toString(), x0, y0, p)
        }
        fun tape(label: String, x0: Float, y0: Float, color: Int): Float {
            val p = tp(44f, C.INK); val tw = p.measureText(label)
            fill.color = color; cv.drawRoundRect(RectF(x0, y0, x0 + tw + 40 * u, y0 + 64 * u), 16 * u, 16 * u, fill)
            cv.drawText(label, x0 + 20 * u, y0 + 47 * u, p)
            return x0 + tw + 40 * u
        }

        // 위 30%는 잠금화면 시계 자리라 비워 둬요.
        var y = h * 0.30f

        // 머리: 닌자 고양이 + 날짜
        val cs = 150 * u
        val cr = RectF(L, y, L + cs, y + cs)
        cv.save(); val clip = Path().apply { addRoundRect(cr, 36 * u, 36 * u, Path.Direction.CW) }; cv.clipPath(clip)
        cv.drawBitmap(cat, null, cr, fill.apply { isFilterBitmap = true }); cv.restore()
        stroke.color = C.LINE; stroke.strokeWidth = 4 * u; cv.drawRoundRect(cr, 36 * u, 36 * u, stroke)
        val d = sc.date
        cv.drawText("${d.monthValue}월 ${d.dayOfMonth}일 ${DOW[d.dayOfWeek.value - 1]}요일", L + cs + 36 * u, y + 58 * u, tp(48f, C.MUTED))
        cv.drawText("시훈이의 오늘", L + cs + 36 * u, y + 132 * u, tp(76f, C.FG))
        y += cs + 48 * u

        val timed = sc.items.filter { it.s != null }
        val untimed = sc.items.filter { it.s == null }
        val nn = nowNext(sc.items, sc.nm)

        if (sc.items.isEmpty()) {
            val r = RectF(L, y, R, y + 300 * u); card(r, C.LINE)
            cv.drawText("오늘 일정이 아직 없어요", L + 56 * u, y + 130 * u, tp(68f, C.FG))
            cv.drawText("엄마가 일정을 넣으면 여기에 보여요", L + 56 * u, y + 214 * u, tp(46f, C.MUTED))
            y += 300 * u + 40 * u
        } else {
            // 지금 칸
            val nowItem = nn.now
            val r = RectF(L, y, R, y + 300 * u)
            card(r, if (nowItem != null) C.RED else C.LINE, if (nowItem != null) 8f else 5f)
            tape("지금", L + 44 * u, y + 40 * u, if (nowItem != null) C.RED else C.LINE)
            if (nowItem != null) {
                text(nowItem.title, tp(96f, C.FG), L + 48 * u, y + 196 * u, R - L - 96 * u)
                cv.drawText(range(nowItem), L + 50 * u, y + 262 * u, tp(48f, C.MUTED))
            } else {
                cv.drawText("정해진 일정이 없는 시간", L + 48 * u, y + 196 * u, tp(68f, C.MUTED))
            }
            y += 300 * u + 36 * u

            // 다음 칸
            val nx = nn.next
            val r2 = RectF(L, y, R, y + 170 * u); card(r2, C.LINE)
            val after = tape("다음", L + 44 * u, y + 53 * u, C.PAL[3])
            if (nx != null) {
                val tw = tp(44f, C.MUTED)
                val tm = ampm(nx.start!!) + " 시작"
                val tmw = tw.measureText(tm)
                text(nx.title, tp(64f, C.FG), after + 28 * u, y + 106 * u, R - after - 80 * u - tmw)
                cv.drawText(tm, R - 44 * u - tmw, y + 104 * u, tw)
            } else {
                cv.drawText("오늘은 더 없어요", after + 28 * u, y + 106 * u, tp(56f, C.MUTED))
            }
            y += 170 * u + 48 * u

            // 오늘 전체 목록(지난 건 흐리게, 지금은 빨간 테두리)
            val bottom = h * 0.86f
            val rowH = 92 * u; val gap = 14 * u
            val room = ((bottom - y - (if (untimed.isNotEmpty()) 110 * u else 0f)) / (rowH + gap)).toInt().coerceAtLeast(1)
            var from = 0
            if (timed.size > room) {
                val ci = timed.indexOfFirst { it.e!! > sc.nm }.let { if (it < 0) timed.size - 1 else it }
                from = (ci - 1).coerceIn(0, timed.size - room)
            }
            val shown = timed.drop(from).take(room)
            for ((i, it) in shown.withIndex()) {
                val idx = from + i
                val isNow = it === nowItem
                val past = sc.nm >= it.e!!
                val rr = RectF(L, y, R, y + rowH)
                val a = if (past) 0x73 else 0xff
                fill.color = C.PAL[idx % C.PAL.size]; fill.alpha = a
                cv.drawRoundRect(rr, 26 * u, 26 * u, fill); fill.alpha = 0xff
                stroke.color = if (isNow) C.RED else Color.BLACK; stroke.strokeWidth = (if (isNow) 9f else 4f) * u
                cv.drawRoundRect(rr, 26 * u, 26 * u, stroke)
                val tt = tp(42f, C.INK).apply { alpha = if (past) 0x99 else 0xcc }
                val time = hm(it.start!!) + (it.end?.let { e -> "~" + hm(e) } ?: "")
                cv.drawText(time, L + 30 * u, y + 60 * u, tt)
                val nameP = tp(52f, C.INK).apply { alpha = if (past) 0x99 else 0xff }
                text(it.title, nameP, L + 300 * u, y + 62 * u, R - L - 330 * u)
                y += rowH + gap
            }
            if (from + shown.size < timed.size) cv.drawText("… 아래로 ${timed.size - from - shown.size}개 더", L + 10 * u, y + 30 * u, tp(38f, C.MUTED))
            if (untimed.isNotEmpty()) {
                y += 24 * u
                text("시간 미정: " + untimed.joinToString(", ") { it.title }, tp(44f, C.MUTED), L + 10 * u, y + 44 * u, R - L - 20 * u)
            }
        }

        // 맨 아래(지문·바로가기 자리 위): 언제 그린 그림인지
        val fp = tp(34f, C.MUTED).apply { alpha = 0xaa }
        cv.drawText(sc.footer, (w - fp.measureText(sc.footer)) / 2, h * 0.895f, fp)
        return bmp
    }

    private fun range(it: Item) = ampm(it.start!!) + (it.end?.let { e -> " ~ " + ampm(e) } ?: "")
}
