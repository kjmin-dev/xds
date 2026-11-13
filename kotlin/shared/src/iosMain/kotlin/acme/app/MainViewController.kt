package acme.app

import androidx.compose.ui.window.ComposeUIViewController
import platform.Foundation.NSProcessInfo

/**
 * What the Swift side of iosApp puts on screen. Launched with `--design`, the app opens the
 * design preview, as the desktop app does: `xcrun simctl launch booted com.example.acme --design`.
 */
fun MainViewController() = ComposeUIViewController {
    App(startInDesign = "--design" in NSProcessInfo.processInfo.arguments)
}
