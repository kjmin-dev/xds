package acme.ui

import platform.UIKit.UIAccessibilityIsReduceMotionEnabled
import androidx.compose.runtime.remember
import acme.tokens.TouchSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/** A phone or tablet is used with fingers. */
actual val platformSizes: Sizes = TouchSizes

@Composable
internal actual fun systemReducedMotion(): Boolean = remember { UIAccessibilityIsReduceMotionEnabled() }

@Composable
internal actual fun SheetWindow(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // The sheet draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            scrimColor = Color.Transparent,
            usePlatformDefaultWidth = false,
            // The scrim covers the status bar and the home indicator; the sheet pads itself.
            usePlatformInsets = false,
        ),
        content = content,
    )
}
