package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals

class CountTextTest {
    @Test
    fun writesTheCountOut() {
        assertEquals("3", countText(3, max = 99))
        assertEquals("99", countText(99, max = 99))
    }

    @Test
    fun aCountOverTheMaxShowsTheMaxAndAPlus() {
        assertEquals("99+", countText(100, max = 99))
        assertEquals("9+", countText(120, max = 9))
    }

    @Test
    fun aStackIsNamedAfterEveryoneInIt() {
        val people = listOf(AvatarPerson("Kim Minjun"), AvatarPerson("Lee Seoyeon", src = "https://example.com/a.png"))
        assertEquals("Kim Minjun, Lee Seoyeon", stackName(people))
        assertEquals("", stackName(emptyList()))
    }
}
