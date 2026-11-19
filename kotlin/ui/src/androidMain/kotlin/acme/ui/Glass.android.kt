package acme.ui

import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.PowerManager
import android.view.accessibility.AccessibilityManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext

@Composable
internal actual fun systemAllowsBlur(): Boolean {
    if (Build.VERSION.SDK_INT < 33) return false
    val context = LocalContext.current
    val activity = context.getSystemService(ActivityManager::class.java)
    if (activity.isLowRamDevice) return false
    val power = context.getSystemService(PowerManager::class.java)
    val accessibility = context.getSystemService(AccessibilityManager::class.java)
    fun allowed() = !power.isPowerSaveMode &&
        (Build.VERSION.SDK_INT < 36 || !accessibility.isHighContrastTextEnabled)
    var blur by remember(context) { mutableStateOf(allowed()) }
    DisposableEffect(context) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) { blur = allowed() }
        }
        context.registerReceiver(receiver, IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED), Context.RECEIVER_NOT_EXPORTED)
        val removeContrast = if (Build.VERSION.SDK_INT >= 36) {
            val listener = AccessibilityManager.HighContrastTextStateChangeListener { blur = allowed() }
            accessibility.addHighContrastTextStateChangeListener(context.mainExecutor, listener)
            val remove: () -> Unit = { accessibility.removeHighContrastTextStateChangeListener(listener) }
            remove
        } else ({})
        blur = allowed()
        onDispose { context.unregisterReceiver(receiver); removeContrast() }
    }
    return blur
}
