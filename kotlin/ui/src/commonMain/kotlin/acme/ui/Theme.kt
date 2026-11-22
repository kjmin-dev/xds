// Acme's Compose components. They take the same variants, sizes and tones as the web components
// in @acme/ui, the GPUI ones in the acme-ui crate and the React Native ones in @acme/ui-native,
// and draw them from the same design tokens.

package acme.ui

import androidx.compose.animation.core.spring
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.FiniteAnimationSpec
import acme.tokens.Colors
import acme.tokens.DefaultTheme
import acme.tokens.Focus
import acme.tokens.Input
import acme.tokens.LocalTheme
import acme.tokens.Mode
import acme.tokens.ShadowToken
import acme.tokens.Theme
import acme.tokens.colors
import acme.tokens.sizes
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

/** The color mode in effect. */
val LocalMode = staticCompositionLocalOf { Mode.Light }

/**
 * The input device the sizes in effect are for. Components that take a different form for each
 * input device ask this, so the form always goes with the sizes: a menu is a popup for a pointer
 * and a sheet for touch.
 */
val LocalInput = staticCompositionLocalOf { platformInput }

/** The color tokens of the theme and mode in effect. */
val LocalColors = staticCompositionLocalOf<Colors> { DefaultTheme.light }

/** The control sizes of the theme and input device in effect. */
val LocalSizes = staticCompositionLocalOf { DefaultTheme.sizes(platformInput) }

// Whether a theme composable is above: a nested one keeps the mode and the input device of the
// one around it unless it is given its own.
private val LocalThemed = staticCompositionLocalOf { false }

/**
 * The color of the text and marks inside a component that sets its own fill or its own look for
 * the content it holds, such as the body of an [Accordion]. [Text] and [Icon] take it unless
 * they are given a tone or a color, and anything else a screen draws there should read it too.
 */
val LocalContentColor = compositionLocalOf { Color.Unspecified }

/**
 * The type role [Text] takes when it is given none: body text, unless a component that holds
 * content in a type of its own, such as the body of an [Accordion], sets another around it.
 */
val LocalTextStyle = compositionLocalOf { DefaultTheme.typography.body }

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
 * Gives the components under it their tokens: the colors of [theme] for [mode], its sizes for
 * [input], and its shared values. It may be placed around the whole app or any part of it, and
 * one inside another applies to its own part only.
 *
 * @param mode The color mode. Without one, it is the mode of the theme composable around this
 *   one, or the system's mode when there is none.
 * @param input The input device the sizes are for. Without one, it is that of the theme
 *   composable around this one, or the platform's: pointer on the desktop, touch on phones.
 * @param theme The token values. Without one, it is the theme around this one, or
 *   [DefaultTheme].
 */
@Composable
fun AcmeTheme(
    mode: Mode = if (LocalThemed.current) LocalMode.current else systemMode(),
    input: Input = if (LocalThemed.current) LocalInput.current else platformInput,
    theme: Theme = LocalTheme.current,
    content: @Composable () -> Unit,
) {
    val colors = theme.colors(mode)
    val sizes = theme.sizes(input)
    val platform = LocalViewConfiguration.current
    // Compose widens the area that reacts to a touch up to this size, whatever is drawn. Taking
    // it from the token makes every pressable part honor `targetMin` without changing its layout.
    val viewConfiguration = remember(platform, sizes) {
        object : ViewConfiguration by platform {
            override val minimumTouchTargetSize = DpSize(sizes.targetMin, sizes.targetMin)
        }
    }
    CompositionLocalProvider(
        LocalThemed provides true,
        LocalTheme provides theme,
        LocalMode provides mode,
        LocalInput provides input,
        LocalColors provides colors,
        LocalSizes provides sizes,
        LocalTextStyle provides theme.typography.body,
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
    val focus = Focus
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
            val width = focus.width.toPx()
            // The gap keeps the ring from blending into the control's own fill.
            val outset = focus.offset.toPx() + width / 2
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
@Composable
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
