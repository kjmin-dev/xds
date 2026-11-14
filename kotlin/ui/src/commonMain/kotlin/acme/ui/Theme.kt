// Acme's Compose components. They take the same variants, sizes and tones as the web components
// in @acme/ui, the GPUI ones in the acme-ui crate and the React Native ones in @acme/ui-native,
// and draw them from the same design tokens.

package acme.ui

import androidx.compose.animation.core.spring
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.FiniteAnimationSpec
import acme.tokens.Colors
import acme.tokens.Focus
import acme.tokens.LightColors
import acme.tokens.Mode
import acme.tokens.PointerSizes
import acme.tokens.ShadowToken
import acme.tokens.Sizes
import acme.tokens.colors
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
// Renamed: the tokens have a `Shadow` of their own.
import androidx.compose.ui.graphics.shadow.Shadow as DropShadow
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.LocalViewConfiguration
import androidx.compose.ui.platform.ViewConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.offset

/** The color tokens of the mode in effect. */
val LocalColors = staticCompositionLocalOf<Colors> { LightColors }

/** The control sizes of the input device in effect. */
val LocalSizes = staticCompositionLocalOf { platformSizes }

/**
 * Whether these are the sizes for a pointer. Components that take a different form for each
 * input device ask this, so the form always goes with the sizes: a menu is a popup with them
 * and a sheet without. Sizes an app made itself count as touch, whose forms work with a pointer
 * as well.
 */
internal val Sizes.forPointer: Boolean get() = this === PointerSizes

/**
 * The color of the text and marks inside a component that sets its own fill, such as a button.
 * `Text` reads it with the `Inherit` tone, and icons drawn by a screen should read it too.
 */
val LocalContentColor = compositionLocalOf { Color.Unspecified }

/** Whether the person asked the system for less motion. Animations check it and jump instead. */
val LocalReducedMotion = staticCompositionLocalOf { false }

/**
 * A spring from the motion tokens, or no animation at all when less motion was asked for.
 * `damping` is a ratio, where 1 does not overshoot.
 */
@Composable
internal fun <T> motionSpec(damping: Float, stiffness: Float): FiniteAnimationSpec<T> =
    if (LocalReducedMotion.current) snap() else spring(dampingRatio = damping, stiffness = stiffness)

/** The mode the system is in. */
@Composable
fun systemMode(): Mode = if (isSystemInDarkTheme()) Mode.Dark else Mode.Light

/**
 * Gives the components under it their colors and sizes. The mode follows the system unless it is
 * set; the sizes follow the platform's input device: pointer on the desktop, touch on phones.
 */
@Composable
fun AcmeTheme(
    mode: Mode = systemMode(),
    sizes: Sizes = platformSizes,
    content: @Composable () -> Unit,
) {
    val colors = colors(mode)
    val platform = LocalViewConfiguration.current
    // Compose widens the area that reacts to a touch up to this size, whatever is drawn. Taking
    // it from the token makes every pressable part honor `targetMin` without changing its layout.
    val viewConfiguration = remember(platform, sizes) {
        object : ViewConfiguration by platform {
            override val minimumTouchTargetSize = DpSize(sizes.targetMin, sizes.targetMin)
        }
    }
    CompositionLocalProvider(
        LocalColors provides colors,
        LocalSizes provides sizes,
        LocalReducedMotion provides systemReducedMotion(),
        LocalViewConfiguration provides viewConfiguration,
        // An opaque highlight: the token set has no translucent colors to layer over text.
        LocalTextSelectionColors provides TextSelectionColors(
            handleColor = colors.accentDefault,
            backgroundColor = colors.accentSubtle,
        ),
        content = content,
    )
}

// Every line takes the full line height with the text centered in it, as on the web. Compose
// would otherwise trim the first and last line, and single-line labels would sit off center.
private val FullLines = LineHeightStyle(
    alignment = LineHeightStyle.Alignment.Center,
    trim = LineHeightStyle.Trim.None,
)

/**
 * Draws a shadow token under a component of the given shape. Goes before the component's fill,
 * and nothing between it and the screen may clip, or the shadow is cut off.
 */
internal fun Modifier.shadow(token: ShadowToken, shape: Shape): Modifier = dropShadow(
    shape = shape,
    shadow = DropShadow(
        radius = token.blur,
        color = token.color,
        spread = token.spread,
        offset = DpOffset(token.offsetX, token.offsetY),
    ),
)

/** A type role ready to draw: in a color, with whole line boxes. */
internal fun TextStyle.resolved(color: Color): TextStyle = copy(color = color, lineHeightStyle = FullLines)

/**
 * Draws the focus ring around a control, outside its bounds. Only when focus was moved by
 * keyboard: a control that was just pressed does not need to say where focus is. Goes before
 * the modifier that makes the control pressable.
 */
@Composable
internal fun Modifier.focusRing(shape: Shape): Modifier {
    val keyboard = LocalInputModeManager.current.inputMode == InputMode.Keyboard
    val color = LocalColors.current.borderFocus
    var visible by remember { mutableStateOf(false) }
    // Where there is a mouse, pressing a control focuses it as well. Whether a press is under
    // way is noted on the way down to the control, so it is known by the time focus arrives.
    val press = remember { Press() }
    return this
        .pointerInput(Unit) {
            awaitPointerEventScope {
                while (true) {
                    press.underWay = awaitPointerEvent(PointerEventPass.Initial).changes.any { it.pressed }
                }
            }
        }
        .onFocusChanged { visible = it.isFocused && !press.underWay }
        .drawWithContent {
            drawContent()
            if (!visible || !keyboard) return@drawWithContent
            val width = Focus.width.toPx()
            // The gap keeps the ring from blending into the control's own fill.
            val outset = Focus.offset.toPx() + width / 2
            val outline = shape.createOutline(
                Size(size.width + outset * 2, size.height + outset * 2),
                layoutDirection,
                this,
            )
            translate(-outset, -outset) { drawOutline(outline, color, style = Stroke(width)) }
        }
}

// Read when focus changes, never while drawing, so it does not need to be observable state.
private class Press(var underWay: Boolean = false)

/**
 * Scrolls sideways when the content does not fit. A scrolling row cuts off what is drawn outside
 * it, which would cut the focus rings of the controls in it, so the part that scrolls reaches
 * past the row's bounds by a ring's width on every side. The row keeps its own size and place.
 */
internal fun Modifier.sidewaysScroll(state: ScrollState): Modifier {
    val room = Focus.offset + Focus.width
    return this
        .layout { measurable, constraints ->
            val reach = room.roundToPx()
            val placeable = measurable.measure(constraints.offset(horizontal = 2 * reach, vertical = 2 * reach))
            layout(placeable.width - 2 * reach, placeable.height - 2 * reach) { placeable.place(-reach, -reach) }
        }
        .horizontalScroll(state)
        .padding(room)
}
