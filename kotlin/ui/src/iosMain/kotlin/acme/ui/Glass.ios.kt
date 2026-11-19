package acme.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import platform.Foundation.lowPowerModeEnabled
import platform.Foundation.NSNotificationCenter
import platform.Foundation.NSOperationQueue
import platform.Foundation.NSProcessInfo
import platform.Foundation.NSProcessInfoPowerStateDidChangeNotification
import platform.UIKit.UIAccessibilityDarkerSystemColorsStatusDidChangeNotification
import platform.UIKit.UIAccessibilityDarkerSystemColorsEnabled
import platform.UIKit.UIAccessibilityIsReduceTransparencyEnabled
import platform.UIKit.UIAccessibilityReduceTransparencyStatusDidChangeNotification

@Composable
internal actual fun systemAllowsBlur(): Boolean {
    fun allowed() = !UIAccessibilityIsReduceTransparencyEnabled() &&
        !UIAccessibilityDarkerSystemColorsEnabled() && !NSProcessInfo.processInfo.lowPowerModeEnabled
    var blur by remember { mutableStateOf(allowed()) }
    DisposableEffect(Unit) {
        val center = NSNotificationCenter.defaultCenter
        val observers = listOf(
            UIAccessibilityReduceTransparencyStatusDidChangeNotification,
            UIAccessibilityDarkerSystemColorsStatusDidChangeNotification,
            NSProcessInfoPowerStateDidChangeNotification,
        ).map { name -> center.addObserverForName(name, null, NSOperationQueue.mainQueue) { blur = allowed() } }
        blur = allowed()
        onDispose { observers.forEach { center.removeObserver(it) } }
    }
    return blur
}
