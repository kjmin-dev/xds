package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals

class MonthPatternTest {
    @Test
    fun aMonthsHeadingIsTheLongDateWithoutItsDay() {
        assertEquals("LLLL y", monthPattern("MMMM d, y"))
        assertEquals("y년 M월", monthPattern("y년 M월 d일"))
        assertEquals("y年M月", monthPattern("y年M月d日"))
        assertEquals("LLLL y", monthPattern("d. MMMM y"))
        assertEquals("LLLL 'de' y", monthPattern("d 'de' MMMM 'de' y"))
        assertEquals("LLLL y 'г'.", monthPattern("d MMMM y 'г'."))
        assertEquals("y. LLLL", monthPattern("y. MMMM d."))
    }
}
