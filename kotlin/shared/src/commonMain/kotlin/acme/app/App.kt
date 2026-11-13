// The app, as every platform shows it: the Android activity, the desktop window and the iOS
// view controller all draw `App()`.

package acme.app

import acme.tokens.Mode
import acme.ui.AcmeTheme
import acme.ui.DesignPreview
import acme.ui.systemMode
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue

/**
 * @param startInDesign Opens the design preview instead of the home screen.
 * @param mode Pins light or dark. Without it the app follows the system.
 */
@Composable
fun App(startInDesign: Boolean = false, mode: Mode? = null) {
    // Two screens need no navigation library: which one is showing is a single flag. It is
    // saved, so turning an Android phone does not drop back to the home screen.
    var design by rememberSaveable { mutableStateOf(startInDesign) }
    AcmeTheme(mode = mode ?: systemMode()) {
        if (design) {
            BackHandler { design = false }
            DesignPreview(onBack = { design = false })
        } else {
            Home(onOpenDesign = { design = true })
        }
    }
}

/** Calls [onBack] for the system's Back button. Only Android has one. */
@Composable
internal expect fun BackHandler(onBack: () -> Unit)
