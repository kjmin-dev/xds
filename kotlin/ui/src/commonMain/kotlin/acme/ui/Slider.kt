package acme.ui

import acme.tokens.Border
import acme.tokens.Focus
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.awaitHorizontalTouchSlopOrCancellation
import androidx.compose.foundation.gestures.horizontalDrag
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import kotlin.math.abs
import kotlin.math.round
import kotlin.math.roundToInt
import kotlin.math.roundToLong

/**
 * Picks a number in a range by dragging the thumb along the track, or by pressing the track
 * where the value should be. Values snap to `step`. On a desktop the arrow keys move it by one
 * step, and so do a screen reader's adjust actions.
 *
 * @param label Shown above the track, and names the slider for a screen reader.
 * @param step The values the slider stops at are `min` plus whole steps.
 * @param showValue Shows the current value at the end of the label's line.
 */
@Composable
fun Slider(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    min: Float = 0f,
    max: Float = 100f,
    step: Float = 1f,
    enabled: Boolean = true,
    showValue: Boolean = false,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val keyboard = LocalInputModeManager.current.inputMode == InputMode.Keyboard
    val ltr = LocalLayoutDirection.current == LayoutDirection.Ltr
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val current = snapped(value, min, max, step)
    val fraction = if (max > min) (current - min) / (max - min) else 0f
    val text = sliderValueText(current, step)
    // Read by the gestures, which outlive the composition that started them.
    val latest by rememberUpdatedState(current)
    val change by rememberUpdatedState(onValueChange)
    var width by remember { mutableIntStateOf(0) }
    val thumb = sizes.sliderThumb

    fun choose(next: Float) {
        val snappedNext = snapped(next, min, max, step)
        if (snappedNext != latest) change(snappedNext)
    }

    // The thumb's center travels from half its width in from one end to as far from the other,
    // so it stays whole at the ends of the range.
    fun valueAt(x: Float, thumbPx: Float): Float {
        val travel = width - thumbPx
        if (travel <= 0f) return latest
        val along = ((x - thumbPx / 2) / travel).coerceIn(0f, 1f)
        return min + (if (ltr) along else 1f - along) * (max - min)
    }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        // The slider says its name and value itself, so a screen reader skips these.
        Row(Modifier.clearAndSetSemantics {}, horizontalArrangement = Arrangement.spacedBy(Space.s3)) {
            FieldLabel(label, enabled, Modifier.weight(1f))
            if (showValue) {
                // Figures of one width, so the label's line does not shift as the value changes.
                BasicText(text, style = Typography.detail.copy(fontFeatureSettings = "tnum").resolved(colors.textSecondary))
            }
        }
        Box(
            Modifier
                .fillMaxWidth()
                // The track is thinner than a finger: the area that reacts is `targetMin` tall.
                .height(maxOf(sizes.targetMin, thumb))
                .onSizeChanged { width = it.width }
                .semantics {
                    contentDescription = label
                    // Said instead of a percentage of the range.
                    stateDescription = text
                    progressBarRangeInfo = ProgressBarRangeInfo(current, min..max, steps = stepsBetween(min, max, step))
                    if (enabled) {
                        setProgress { target ->
                            choose(target)
                            true
                        }
                    } else {
                        disabled()
                    }
                }
                .onKeyEvent { event ->
                    if (!enabled || event.type != KeyEventType.KeyDown) return@onKeyEvent false
                    // Right is toward the larger values only when the track reads left to right.
                    val forward = if (ltr) 1 else -1
                    val steps = when (event.key) {
                        Key.DirectionRight -> forward
                        Key.DirectionLeft -> -forward
                        Key.DirectionUp -> 1
                        Key.DirectionDown -> -1
                        else -> return@onKeyEvent false
                    }
                    choose(latest + steps * step)
                    true
                }
                .focusable(enabled, interactions)
                .pointerInput(enabled, ltr, min, max, step) {
                    if (!enabled) return@pointerInput
                    val thumbPx = thumb.toPx()
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        // A mouse press moves the thumb at once. A finger on a page that scrolls
                        // may be starting a scroll, so the thumb waits to see which way it goes.
                        val touch = down.type == PointerType.Touch
                        if (!touch) choose(valueAt(down.position.x, thumbPx))
                        val drag = awaitHorizontalTouchSlopOrCancellation(down.id) { move, _ -> move.consume() }
                        if (drag != null) {
                            choose(valueAt(drag.position.x, thumbPx))
                            horizontalDrag(drag.id) { move ->
                                choose(valueAt(move.position.x, thumbPx))
                                move.consume()
                            }
                        } else if (touch) {
                            // Lifted without moving: a tap, which moves the thumb there. A scroll
                            // that took the gesture over leaves the finger down.
                            val last = currentEvent.changes.firstOrNull { it.id == down.id }
                            if (last != null && !last.pressed && !last.isConsumed) choose(valueAt(down.position.x, thumbPx))
                        }
                    }
                }
                .drawBehind {
                    val track = sizes.sliderTrack.toPx()
                    val radius = thumb.toPx() / 2
                    val middle = size.height / 2
                    val travel = size.width - 2 * radius
                    val x = if (ltr) radius + travel * fraction else size.width - radius - travel * fraction
                    val ends = CornerRadius(track / 2)
                    val fill = if (enabled) colors.sliderFill else colors.sliderDisabledFill
                    drawRoundRect(colors.sliderTrack, Offset(0f, middle - track / 2), Size(size.width, track), ends)
                    // From the start of the range, whichever side that is, to the thumb.
                    val (from, to) = if (ltr) 0f to x else x to size.width
                    drawRoundRect(fill, Offset(from, middle - track / 2), Size(to - from, track), ends)
                    val border = Border.widthThick.toPx()
                    drawCircle(colors.sliderThumb, radius, Offset(x, middle))
                    // Inside the thumb's bounds, so the outline adds nothing to its size.
                    drawCircle(
                        if (enabled) colors.sliderThumbBorder else colors.sliderDisabledFill,
                        radius - border / 2,
                        Offset(x, middle),
                        style = Stroke(border),
                    )
                    if (focused && keyboard) {
                        // Around the thumb, which is where the keys act, with the gap of every
                        // other focus ring.
                        val ring = Focus.width.toPx()
                        drawCircle(
                            colors.borderFocus,
                            radius + Focus.offset.toPx() + ring / 2,
                            Offset(x, middle),
                            style = Stroke(ring),
                        )
                    }
                },
        )
    }
}

/** [value] moved to the nearest of the values the slider stops at, inside the range. */
internal fun snapped(value: Float, min: Float, max: Float, step: Float): Float {
    if (max <= min) return min
    if (step <= 0f) return value.coerceIn(min, max)
    val steps = ((value - min) / step).roundToInt()
    return (min + steps * step).coerceIn(min, max)
}

/** How many values the slider stops at between its two ends, which a screen reader counts. */
private fun stepsBetween(min: Float, max: Float, step: Float): Int =
    if (step <= 0f || max <= min) 0 else (((max - min) / step).roundToInt() - 1).coerceAtLeast(0)

/** The value as the slider shows it: with as many decimals as [step] has, and no more. */
internal fun sliderValueText(value: Float, step: Float): String {
    // Counted on the step as written: 0.25 has two decimals, 5 has none. A float is not exact,
    // so a digit is counted only while what is left is more than a rounding error.
    var decimals = 0
    var scaled = step.toDouble()
    while (decimals < 4 && abs(scaled - round(scaled)) > 1e-4) {
        scaled *= 10
        decimals++
    }
    if (decimals == 0) return value.roundToLong().toString()
    var factor = 1L
    repeat(decimals) { factor *= 10 }
    val units = (value.toDouble() * factor).roundToLong()
    val sign = if (units < 0) "-" else ""
    val whole = abs(units) / factor
    val part = (abs(units) % factor).toString().padStart(decimals, '0')
    return "$sign$whole.$part"
}
