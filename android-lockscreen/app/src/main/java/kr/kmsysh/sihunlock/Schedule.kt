package kr.kmsysh.sihunlock

import java.time.LocalDate
import java.time.LocalTime

/** Firestore 문서 하나(필드만). schedule / schedOverrides 둘 다 이 모양으로 읽어요. */
typealias Doc = Map<String, Any?>

data class Item(
    val title: String,
    val start: String?, // "HH:MM" 또는 null(시간 미정)
    val end: String?,
    val note: String?,
) {
    val s: Int? get() = start?.let { mins(it) }
    /** 웹 시간표(sihun-board timetable)와 같은 규칙: 끝이 없으면 20분, 너무 짧으면 10분 */
    val e: Int? get() = s?.let { s0 -> if (end != null) maxOf(mins(end), s0 + 10) else s0 + 20 }
}

fun mins(t: String): Int {
    val p = t.split(":")
    return (p.getOrNull(0)?.trim()?.toIntOrNull() ?: 0) * 60 + (p.getOrNull(1)?.trim()?.toIntOrNull() ?: 0)
}

private val DAYS = listOf("mon", "tue", "wed", "thu", "fri", "sat", "sun")
fun dayKey(d: LocalDate): String = DAYS[d.dayOfWeek.value - 1]

private fun Doc.str(k: String): String? = (this[k] as? String)?.takeIf { it.isNotBlank() }

/**
 * 그날 일정 = 우리집 기지·시훈이 대시보드의 schedItems 와 같은 규칙.
 * 매주 일정(day 맞고 from~until 안) 중 그날만 바꾼 것(baseId)은 빼고, 그날만 일정(skip 아닌 것)을 더함.
 */
fun itemsFor(date: LocalDate, schedule: List<Doc>, overrides: List<Doc>): List<Item> {
    val ds = date.toString()
    val dk = dayKey(date)
    val ov = overrides.filter { it.str("date") == ds }
    val hidden = ov.mapNotNull { it.str("baseId") }.toSet()
    val base = schedule.filter {
        it.str("day") == dk && it["id"] !in hidden &&
            (it.str("from")?.let { f -> f <= ds } ?: true) &&
            (it.str("until")?.let { u -> ds <= u } ?: true)
    }
    val extra = ov.filter { it["skip"] != true }
    return (base + extra)
        .map { Item(it.str("title") ?: "", it.str("start"), it.str("end"), it.str("note")) }
        .sortedWith(compareBy({ it.start ?: "99" }, { it.e ?: 0 }))
}

/** 지금 칸·다음 칸 */
data class NowNext(val now: Item?, val next: Item?)

fun nowNext(items: List<Item>, nm: Int): NowNext {
    val timed = items.filter { it.s != null }
    val now = timed.firstOrNull { nm >= it.s!! && nm < it.e!! }
    val next = timed.filter { it.s!! > nm }.minByOrNull { it.s!! }
    return NowNext(now, next)
}

/** 다음에 화면이 바뀌어야 하는 시각(분). 없으면 null(=자정). */
fun nextBoundary(items: List<Item>, nm: Int): Int? =
    items.flatMap { listOfNotNull(it.s, it.e) }.filter { it > nm && it < 24 * 60 }.minOrNull()

fun nowMinutes(t: LocalTime = LocalTime.now()): Int = t.hour * 60 + t.minute

/** "15:00" → "3:00" (오전/오후 없이) */
fun hm(t: String): String {
    val m = mins(t); val h = (m / 60) % 12
    return "${if (h == 0) 12 else h}:${"%02d".format(m % 60)}"
}

/** "15:00" → "오후 3:00" */
fun ampm(t: String): String = (if (mins(t) < 12 * 60) "오전 " else "오후 ") + hm(t)
