package acme.ui

import acme.tokens.Motion
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.semantics.dismiss
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

// How far down the sheet has to be dragged, as a share of its height, to dismiss it.
private const val DismissAt = 0.25f

/**
 * A panel that slides up over the screen for a short task or a choice, and dims what is behind
 * it. It floats a little clear of the screen's edges. Tapping outside, dragging it down, Back and Escape all ask to dismiss it.
 *
 * @param onDismiss Called when the person asks to close the sheet. Set `open` to false in it.
 */
@Composable
fun BottomSheet(
    open: Boolean,
    onDismiss: () -> Unit,
    title: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    // How much of the sheet is off the bottom of the screen: 1 is all of it, 0 is none. One
    // number for sliding in, sliding out and dragging, so each picks up where the last one was.
    val hidden = remember { Animatable(1f) }
    // With less motion asked for, the sheet appears in place instead of sliding.
    val slide = if (LocalReducedMotion.current) 0 else Motion.durationSlow
    // The layer outlives `open` by the time the sheet takes to slide out.
    var present by remember { mutableStateOf(false) }
    LaunchedEffect(open) {
        if (open) {
            present = true
            hidden.animateTo(0f, tween(slide, easing = Motion.easingEnter))
        } else if (present) {
            hidden.animateTo(1f, tween(slide, easing = Motion.easingExit))
            present = false
        }
    }
    if (!present) return

    val requestDismiss by rememberUpdatedState(onDismiss)
    WindowLayer(onDismiss = { requestDismiss() }) {
        val colors = LocalColors.current
        // How far the sheet has to move to be off the screen, and its own height, in pixels.
        var travel by remember { mutableStateOf(0) }
        var height by remember { mutableStateOf(0) }
        // The part of a drag that is not folded into `hidden` yet, in pixels.
        var dragged by remember { mutableStateOf(0f) }
        // Everything that draws reads this, so the sheet and the scrim move together.
        fun hiddenNow(): Float = if (travel > 0) (hidden.value + dragged / travel).coerceIn(0f, 1f) else hidden.value
        val shape = RoundedCornerShape(Radius.xl)
        Box(Modifier.fillMaxSize()) {
            Box(
                Modifier
                    .fillMaxSize()
                    // Fades with the sheet's position, so a drag lightens it too.
                    .graphicsLayer { alpha = 1f - hiddenNow() }
                    .background(colors.scrim)
                    .pointerInput(Unit) { detectTapGestures { requestDismiss() } },
            )
            // The sheet floats clear of the screen's edges. What slides is the sheet together
            // with the space under it, so that it leaves the screen entirely.
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .onSizeChanged { travel = it.height }
                    .graphicsLayer { translationY = hiddenNow() * size.height }
                    // The margin comes on top of the home indicator's inset, and of the keyboard.
                    .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom))
                    .padding(start = Space.s2, end = Space.s2, bottom = Space.s2),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .onSizeChanged { height = it.height }
                        .shadow(Shadow.overlay, shape)
                        .background(colors.sheetBackground, shape)
                        // Also keeps taps on the sheet from reaching the scrim under it.
                        .draggable(
                            orientation = Orientation.Vertical,
                            // Only downward: the sheet does not lift off its place.
                            state = rememberDraggableState { delta -> dragged = (dragged + delta).coerceAtLeast(0f) },
                            onDragStopped = {
                                val far = dragged > height * DismissAt
                                hidden.snapTo(hiddenNow())
                                dragged = 0f
                                if (far) {
                                    requestDismiss()
                                } else {
                                    hidden.animateTo(0f, tween(Motion.durationFast, easing = Motion.easingStandard))
                                }
                            },
                        )
                        .semantics {
                            if (title != null) paneTitle = title
                            dismiss { requestDismiss(); true }
                        },
                ) {
                    Box(
                        Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(top = Space.s2)
                            .size(36.dp, 4.dp)
                            .background(colors.sheetHandle, CircleShape),
                    )
                    Column(Modifier.padding(Space.s4), verticalArrangement = Arrangement.spacedBy(Space.s3)) {
                        if (title != null) Text(title, style = Typography.heading, tone = TextTone.Primary, heading = true)
                        content()
                    }
                }
            }
        }
    }
}
