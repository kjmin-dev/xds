package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals

class LimitedTest {
    @Test
    fun keepsTextThatFits() {
        assertEquals("hello", limited("hello", max = 5))
        assertEquals("", limited("", max = 0))
    }

    @Test
    fun cutsTextThatIsTooLong() {
        assertEquals("hel", limited("hello", max = 3))
        assertEquals("", limited("hello", max = 0))
    }

    @Test
    fun neverKeepsHalfALetter() {
        // U+1D538 is one letter stored as two chars: cutting between them would leave a broken one.
        assertEquals("a", limited("a𝔸b", max = 2))
        assertEquals("a𝔸", limited("a𝔸b", max = 3))
    }
}
