package kr.kmsysh.sihunlock

import android.graphics.Bitmap
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.time.LocalDate

/** 가짜 일정으로만 시험해요(실제 Firestore엔 아무것도 안 씀). */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34])
class RenderTest {
    private val tue = LocalDate.of(2026, 11, 24) // 화요일
    private val schedule = listOf(
        mapOf("id" to "a", "day" to "tue", "title" to "학교", "start" to "08:40", "end" to "13:30"),
        mapOf("id" to "b", "day" to "tue", "title" to "태권도", "start" to "14:00", "end" to "15:00"),
        mapOf("id" to "c", "day" to "tue", "title" to "피아노", "start" to "15:30", "end" to "16:20"),
        mapOf("id" to "d", "day" to "tue", "title" to "수학 학원", "start" to "17:00", "end" to "18:30"),
        mapOf("id" to "e", "day" to "tue", "title" to "저녁", "start" to "18:40", "end" to "19:20"),
        mapOf("id" to "f", "day" to "wed", "title" to "수요일 것", "start" to "15:00", "end" to "16:00"),
        mapOf("id" to "g", "day" to "tue", "title" to "끝난 것", "start" to "10:00", "until" to "2026-11-01"),
    )
    private val overrides = listOf(
        mapOf("id" to "o1", "date" to "2026-11-24", "baseId" to "c", "skip" to true),
        mapOf("id" to "o2", "date" to "2026-11-24", "title" to "책 읽기", "start" to "20:00", "end" to "20:30"),
        mapOf("id" to "o3", "date" to "2026-11-24", "title" to "준비물 챙기기"),
    )

    @Test fun rules() {
        val it = itemsFor(tue, schedule, overrides)
        assertEquals(listOf("학교", "태권도", "수학 학원", "저녁", "책 읽기", "준비물 챙기기"), it.map { x -> x.title })
        val nn = nowNext(it, mins("14:30"))
        assertEquals("태권도", nn.now?.title); assertEquals("수학 학원", nn.next?.title)
        val gap = nowNext(it, mins("16:00"))
        assertNull(gap.now); assertEquals("수학 학원", gap.next?.title)
        assertEquals(mins("15:00"), nextBoundary(it, mins("14:30")))
        assertEquals(listOf<String>(), itemsFor(tue, emptyList(), emptyList()).map { x -> x.title })
    }

    @Test fun previews() {
        val ctx = ApplicationProvider.getApplicationContext<android.content.Context>()
        val out = File(System.getProperty("previewDir") ?: "build/previews").apply { mkdirs() }
        val items = itemsFor(tue, schedule, overrides)
        fun save(name: String, b: Bitmap) = File(out, "$name.png").outputStream().use { b.compress(Bitmap.CompressFormat.PNG, 100, it) }
        save("now-taekwondo", Renderer.render(ctx, 1080, 2340, Scene(tue, items, mins("14:30"), "오후 2:30 일정 기준")))
        save("gap-before-math", Renderer.render(ctx, 1080, 2340, Scene(tue, items, mins("16:05"), "오후 4:00 일정 기준")))
        save("empty", Renderer.render(ctx, 1080, 2340, Scene(tue, emptyList(), mins("09:00"), "오전 9:00 일정 기준")))
        val many = (0 until 12).map { i -> Item("일정 ${i + 1}", "%02d:00".format(8 + i), "%02d:50".format(8 + i), null) }
        save("many-small-phone", Renderer.render(ctx, 720, 1600, Scene(tue, many, mins("15:20"), "인터넷이 안 돼서 오후 3:00 일정 기준")))
    }
}
