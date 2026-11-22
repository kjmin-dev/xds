package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DefaultsTest {
    @Test
    fun anInnerDefaultsReplacesOnlyTheOptionsItNames() {
        val outer = ComponentDefaults(
            button = ButtonDefaults(variant = ButtonVariant.Primary, size = ControlSize.Lg),
            badge = BadgeDefaults(tone = BadgeTone.Accent),
        )
        val merged = outer.with(ComponentDefaults(button = ButtonDefaults(size = ControlSize.Sm)))
        assertEquals(ButtonVariant.Primary, merged.button.variant)
        assertEquals(ControlSize.Sm, merged.button.size)
        assertEquals(BadgeTone.Accent, merged.badge.tone)
        assertNull(merged.text.tone)
    }

    @Test
    fun defaultsWithNothingSetChangeNothing() {
        val outer = ComponentDefaults(text = TextDefaults(tone = TextTone.Secondary))
        assertEquals(TextTone.Secondary, outer.with(ComponentDefaults()).text.tone)
        assertEquals(TextTone.Secondary, ComponentDefaults().with(outer).text.tone)
    }
}
