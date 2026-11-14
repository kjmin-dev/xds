package acme.ui

import acme.tokens.Motion
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import kotlinx.coroutines.delay

/** What a [Toast] offers to do about its message, such as undoing it: the label and what it does. */
class ToastAction(val label: String, val onClick: () -> Unit)

/**
 * A short message about what just happened, which leaves on its own. It sits above the screen
 * at the bottom center of the window, inside the safe area. It takes neither the focus nor the
 * presses beside it, and a screen reader reads it out without moving there. Do not make it the
 * only way to an action: it is gone in a few seconds.
 *
 * @param open Whether the toast is shown. It never closes itself: `onClose` asks for that.
 * @param onClose Called when `duration` is up, and after the action was chosen.
 * @param action One thing to do about the message. Choosing it calls its `onClick`, then
 *   `onClose`.
 * @param duration How long the toast stays, in milliseconds. 0 keeps it until `open` is false.
 */
@Composable
fun Toast(
    open: Boolean,
    onClose: () -> Unit,
    message: String,
    modifier: Modifier = Modifier,
    action: ToastAction? = null,
    duration: Int = Motion.durationToast,
) {
    val requestClose by rememberUpdatedState(onClose)
    // The clock runs from when the toast opens, whatever the handler is by the time it ends.
    LaunchedEffect(open, duration) {
        if (open && duration > 0) {
            delay(duration.toLong())
            requestClose()
        }
    }
    // How far the toast has come in: 0 is gone, 1 is in place.
    val shown = remember { Animatable(0f) }
    // With less motion asked for, the toast appears and goes at once.
    val slide = if (LocalReducedMotion.current) 0 else Motion.durationNormal
    // The popup outlives `open` by the time the toast takes to fade out.
    var present by remember { mutableStateOf(false) }
    LaunchedEffect(open) {
        if (open) {
            present = true
            shown.animateTo(1f, tween(slide, easing = Motion.easingEnter))
        } else if (present) {
            shown.animateTo(0f, tween(slide, easing = Motion.easingExit))
            present = false
        }
    }
    if (!present) return

    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val density = LocalDensity.current
    val margin = with(density) { Space.s4.roundToPx() }
    val rise = with(density) { Space.s2.toPx() }
    val position = remember(margin) { ToastPosition(margin) }
    val shape = RoundedCornerShape(Radius.md)
    // Not the window layer of a dialog, which takes the focus and every press. A popup that
    // cannot be focused is as large as the toast, so it takes nothing from the screen but the
    // presses on the toast itself, and it is drawn above the screen wherever it is composed.
    Popup(
        popupPositionProvider = position,
        properties = PopupProperties(focusable = false, dismissOnBackPress = false, dismissOnClickOutside = false),
    ) {
        Row(
            modifier = modifier
                .layout { measurable, constraints ->
                    // At most `size.toast` wide, and `space.4` clear of the window's sides.
                    val room = if (constraints.hasBoundedWidth) constraints.maxWidth - 2 * margin else Int.MAX_VALUE
                    val most = minOf(sizes.toast.roundToPx(), room).coerceAtLeast(0)
                    val placeable = measurable.measure(constraints.copy(minWidth = 0, maxWidth = most))
                    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
                }
                .graphicsLayer {
                    alpha = shown.value
                    translationY = (1f - shown.value) * rise
                }
                .shadow(Shadow.raised, shape)
                .background(colors.toastBackground, shape)
                // Read out when it appears, after what is being read, without moving there.
                .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite }
                .padding(horizontal = Space.s4, vertical = Space.s3),
            horizontalArrangement = Arrangement.spacedBy(Space.s4),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                text = message,
                modifier = Modifier.weight(1f, fill = false),
                style = Typography.detail.resolved(colors.toastText),
            )
            if (action != null) {
                ToastActionButton(action, onChosen = { requestClose() })
            }
        }
    }
}

/** The action of a toast: text in the action color, as large as the smallest target. */
@Composable
private fun ToastActionButton(action: ToastAction, onChosen: () -> Unit) {
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    // The toast has no fills for the states of its action: it is underlined under a pointer and
    // shrinks a little while pressed, as a button does, so neither depends on color.
    val scale by animateFloatAsState(
        targetValue = if (pressed) Motion.pressScale else 1f,
        animationSpec = motionSpec(Motion.springFastDamping, Motion.springFastStiffness),
    )
    Box(
        modifier = Modifier
            // The target reaches into the toast's padding, above and below so that it does not
            // make a one-line toast taller, and at the end so that the label ends where the
            // padding does.
            .layout { measurable, constraints ->
                val placeable = measurable.measure(constraints)
                val line = Typography.label.lineHeight.roundToPx()
                val above = ((placeable.height - line) / 2).coerceIn(0, Space.s3.roundToPx())
                val end = Space.s2.roundToPx()
                layout(placeable.width - end, placeable.height - 2 * above) {
                    placeable.placeRelative(0, -above)
                }
            }
            .defaultMinSize(minWidth = sizes.targetMin, minHeight = sizes.targetMin)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clickable(
                interactionSource = interactions,
                indication = null,
                role = Role.Button,
                onClick = {
                    action.onClick()
                    onChosen()
                },
            )
            .padding(horizontal = Space.s2),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text = action.label,
            style = Typography.label.resolved(LocalColors.current.toastAction)
                .copy(textDecoration = if (hovered) TextDecoration.Underline else TextDecoration.None),
            maxLines = 1,
        )
    }
}

/** At the bottom center of the window, [margin] above its bottom edge. */
private class ToastPosition(private val margin: Int) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize,
    ): IntOffset = IntOffset(
        x = (windowSize.width - popupContentSize.width) / 2,
        y = windowSize.height - popupContentSize.height - margin,
    )
}
