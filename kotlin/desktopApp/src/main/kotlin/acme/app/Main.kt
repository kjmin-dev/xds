package acme.app

import acme.tokens.Mode
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

/**
 * `--design` opens the design preview instead of the home screen. `--light` and `--dark` pin
 * the mode; without either the app follows the system.
 */
fun main(args: Array<String>) {
    val design = "--design" in args
    val mode = when {
        "--light" in args -> Mode.Light
        "--dark" in args -> Mode.Dark
        else -> null
    }
    // macOS draws the title bar light whatever the mode, unless it is told before the first
    // window opens.
    System.setProperty(
        "apple.awt.application.appearance",
        when (mode) {
            Mode.Light -> "NSAppearanceNameAqua"
            Mode.Dark -> "NSAppearanceNameDarkAqua"
            null -> "system"
        },
    )
    application {
        Window(
            onCloseRequest = ::exitApplication,
            title = "Acme",
            state = rememberWindowState(width = 960.dp, height = 720.dp),
        ) {
            App(startInDesign = design, mode = mode)
        }
    }
}
