package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals

class ControlValuesTest {
    @Test
    fun aSliderSnapsToTheNearestStepInsideItsRange() {
        assertEquals(40f, snapped(41.4f, 0f, 100f, 5f))
        assertEquals(45f, snapped(42.6f, 0f, 100f, 5f))
        assertEquals(100f, snapped(130f, 0f, 100f, 5f))
        assertEquals(0f, snapped(-3f, 0f, 100f, 5f))
        // Steps count from the minimum, not from zero.
        assertEquals(13f, snapped(14f, 3f, 23f, 5f))
    }

    @Test
    fun aSliderShowsAsManyDecimalsAsItsStep() {
        assertEquals("40", sliderValueText(40f, 1f))
        assertEquals("0.75", sliderValueText(0.75f, 0.05f))
        assertEquals("0.5", sliderValueText(0.5f, 0.1f))
        assertEquals("0.50", sliderValueText(0.5f, 0.25f))
        assertEquals("-1.5", sliderValueText(-1.5f, 0.5f))
    }

    @Test
    fun anAccordionOpensOneItemOrSeveral() {
        assertEquals(setOf("b"), toggled(setOf("a"), "b", multiple = false))
        assertEquals(setOf("a", "b"), toggled(setOf("a"), "b", multiple = true))
        assertEquals(emptySet(), toggled(setOf("a"), "a", multiple = false))
        assertEquals(setOf("b"), toggled(setOf("a", "b"), "a", multiple = true))
    }
}
