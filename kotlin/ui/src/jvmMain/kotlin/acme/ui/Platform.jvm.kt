package acme.ui

import acme.tokens.PointerSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/** A desktop is used with a mouse. */
actual val platformSizes: Sizes = PointerSizes

// The JVM has no API for the desktop's reduce-motion setting.
@Composable
internal actual fun systemReducedMotion(): Boolean = false

@Composable
internal actual fun SheetWindow(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // The sheet draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            scrimColor = Color.Transparent,
            usePlatformDefaultWidth = false,
            usePlatformInsets = false,
        ),
        content = content,
    )
}
