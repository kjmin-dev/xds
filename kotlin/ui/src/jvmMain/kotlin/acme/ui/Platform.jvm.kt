package acme.ui

import acme.tokens.PointerSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/** A desktop is used with a mouse. */
actual val platformSizes: Sizes = PointerSizes

// The JVM has no API for the desktop's reduce-motion setting.
@Composable
internal actual fun systemReducedMotion(): Boolean = false

@OptIn(ExperimentalComposeUiApi::class)
@Composable
internal actual fun WindowLayer(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // What is shown draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            scrimColor = Color.Transparent,
            usePlatformDefaultWidth = false,
            usePlatformInsets = false,
            // What is shown moves in with the motion tokens, and not at all when less motion
            // is asked for. The layer's own fade would come on top of that.
            animateTransition = false,
        ),
        content = content,
    )
}
