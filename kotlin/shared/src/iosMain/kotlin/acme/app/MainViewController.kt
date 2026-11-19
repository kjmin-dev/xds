package acme.app

import androidx.compose.ui.window.ComposeUIViewController
import platform.Foundation.NSProcessInfo

/**
 * What the Swift side of iosApp puts on screen. Launched with `--design`, the app opens the
 * design preview, as the desktop app does: `xcrun simctl launch booted com.example.acme --design`.
 */
fun MainViewController() = ComposeUIViewController {
    val args = NSProcessInfo.processInfo.arguments.filterIsInstance<String>()
    val section = args.zipWithNext().firstOrNull { it.first == "--section" }?.second
    val glass = args.zipWithNext().firstOrNull { it.first == "--glass" }?.second
    App(startInDesign = "--design" in args || section != null, section = section, glass = glass, autoscroll = "--autoscroll" in args)
}
