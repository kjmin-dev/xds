package acme.ui

import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.remember
import android.provider.Settings
import acme.tokens.Sizes
import acme.tokens.TouchSizes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider

/** A phone or tablet is used with fingers. */
actual val platformSizes: Sizes = TouchSizes

// Android has no "reduce motion" switch of its own: "Remove animations" sets this scale to 0.
@Composable
internal actual fun systemReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return remember(resolver) {
        Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
}

@Composable
internal actual fun SheetWindow(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // The sheet draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false,
            // The scrim covers the system bars; the sheet pads itself.
            decorFitsSystemWindows = false,
        ),
    ) {
        // Android dims the screen behind a dialog on its own, which would darken the scrim twice.
        val window = (LocalView.current.parent as? DialogWindowProvider)?.window
        SideEffect { window?.setDimAmount(0f) }
        content()
    }
}
