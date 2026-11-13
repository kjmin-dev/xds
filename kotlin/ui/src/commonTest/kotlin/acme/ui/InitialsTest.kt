package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals

class InitialsTest {
    @Test
    fun takesTheFirstLetterOfTheFirstTwoWords() {
        assertEquals("KM", initials("Kim Minjun"))
        assertEquals("AB", initials("Ada Byron Lovelace"))
    }

    @Test
    fun uppercases() {
        assertEquals("AL", initials("ada lovelace"))
    }

    @Test
    fun aSingleWordGivesOneLetter() {
        assertEquals("M", initials("Minjun"))
        assertEquals("다", initials("다람쥐"))
    }

    @Test
    fun theSmallAvatarAsksForOneLetter() {
        assertEquals("K", initials("Kim Minjun", max = 1))
    }

    @Test
    fun ignoresExtraSpace() {
        assertEquals("KM", initials("  Kim \t Minjun  "))
    }

    @Test
    fun anEmptyNameGivesNothing() {
        assertEquals("", initials(""))
        assertEquals("", initials("   "))
    }

    @Test
    fun keepsALetterOutsideTheBasicPlaneWhole() {
        // U+1D538 is one letter stored as two chars.
        assertEquals("𝔸", initials("𝔸lice"))
    }
}
