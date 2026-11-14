package acme.ui

import platform.UIKit.UIAccessibilityIsReduceMotionEnabled
import androidx.compose.runtime.remember
import acme.tokens.TouchSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/** A phone or tablet is used with fingers. */
actual val platformSizes: Sizes = TouchSizes

@Composable
internal actual fun systemReducedMotion(): Boolean = remember { UIAccessibilityIsReduceMotionEnabled() }

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
            // The scrim covers the status bar and the home indicator; what is shown pads itself.
            usePlatformInsets = false,
            // What is shown moves in with the motion tokens, and not at all when Reduce Motion
            // is on. The layer's own fade would come on top of that, whatever the setting.
            animateTransition = false,
        ),
        content = content,
    )
}
