package acme.ui

import acme.tokens.Border
import acme.tokens.Motion
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics

/**
 * A window that interrupts the screen for a confirmation or a short task. It is centered over a
 * scrim, and its body scrolls when it is taller than the screen. For a set of choices, or a task
 * that leaves the screen in view, use a [BottomSheet].
 *
 * @param open Whether the dialog is shown. It never closes itself: `onClose` asks for that.
 * @param onClose Called for Escape, Back and a press on the scrim, unless `dismissible` is false.
 * @param description What the dialog asks or tells, under the title.
 * @param dismissible False keeps Escape, Back and the scrim from closing the dialog, for a
 *   question that must be answered with one of the `actions`.
 * @param actions Buttons, in a row at the end edge. Put the main action last.
 * @param content Under the description, and scrolls with it.
 */
@Composable
fun Dialog(
    open: Boolean,
    onClose: () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    dismissible: Boolean = true,
    actions: (@Composable RowScope.() -> Unit)? = null,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    // How far the dialog has come in: 0 is gone, 1 is in place.
    val shown = remember { Animatable(0f) }
    // With less motion asked for, the dialog appears and goes at once.
    val fade = if (LocalReducedMotion.current) 0 else Motion.durationNormal
    // The layer outlives `open` by the time the dialog takes to fade out.
    var present by remember { mutableStateOf(false) }
    LaunchedEffect(open) {
        if (open) {
            present = true
            shown.animateTo(1f, tween(fade, easing = Motion.easingEnter))
        } else if (present) {
            shown.animateTo(0f, tween(fade, easing = Motion.easingExit))
            present = false
        }
    }
    if (!present) return

    val requestClose by rememberUpdatedState(onClose)
    val mayClose by rememberUpdatedState(dismissible)
    val dismiss = { if (mayClose) requestClose() }
    WindowLayer(onDismiss = dismiss) {
        val colors = LocalColors.current
        val shape = RoundedCornerShape(Radius.lg)
        val focus = remember { FocusRequester() }
        Box(Modifier.fillMaxSize()) {
            Box(
                Modifier
                    .fillMaxSize()
                    .graphicsLayer { alpha = shown.value }
                    .background(colors.scrim)
                    .pointerInput(Unit) { detectTapGestures { dismiss() } },
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .windowInsetsPadding(WindowInsets.safeDrawing)
                    .padding(Space.s4),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    modifier = modifier
                        .widthIn(max = LocalSizes.current.dialog)
                        .fillMaxWidth()
                        .graphicsLayer {
                            alpha = shown.value
                            // It grows the last few percent into place: as far as a press
                            // shrinks a button.
                            val scale = Motion.pressScale + (1f - Motion.pressScale) * shown.value
                            scaleX = scale
                            scaleY = scale
                        }
                        .shadow(Shadow.overlay, shape)
                        .background(colors.dialogBackground, shape)
                        .border(Border.widthThin, colors.dialogBorder, shape)
                        // Also keeps presses on the dialog from reaching the scrim under it.
                        .pointerInput(Unit) { detectTapGestures {} }
                        // Focus moves to the dialog itself, as on the web: the keyboard goes on
                        // from there to the actions, and a screen reader reads the title and
                        // the description together.
                        .semantics { paneTitle = title }
                        .focusRequester(focus)
                        .focusable()
                        .padding(Space.s6),
                    verticalArrangement = Arrangement.spacedBy(Space.s4),
                ) {
                    BasicText(
                        text = title,
                        modifier = Modifier.semantics { heading() },
                        style = Typography.title.resolved(colors.dialogTitle),
                    )
                    if (description != null || content != null) {
                        Column(
                            // Gives way first when the dialog would be taller than the screen:
                            // the title and the actions stay in sight and this scrolls between.
                            modifier = Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(Space.s4),
                        ) {
                            if (description != null) {
                                BasicText(description, style = Typography.body.resolved(colors.dialogText))
                            }
                            content?.invoke(this)
                        }
                    }
                    if (actions != null) {
                        // Wraps onto a second line, still at the end edge, when the buttons do
                        // not fit side by side.
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Space.s2, Alignment.End),
                            verticalArrangement = Arrangement.spacedBy(Space.s2),
                        ) {
                            actions()
                        }
                    }
                }
            }
        }
        LaunchedEffect(Unit) { focus.requestFocus() }
    }
}
