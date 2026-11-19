package acme.ui

import android.app.ActivityManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.PowerManager
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GlassSettingsModule : Module() {
    private val context get() = requireNotNull(appContext.reactContext)
    private var stop: (() -> Unit)? = null

    private fun allowed(): Boolean {
        if (Build.VERSION.SDK_INT < 33) return false
        return !context.getSystemService(ActivityManager::class.java).isLowRamDevice &&
            !context.getSystemService(PowerManager::class.java).isPowerSaveMode &&
            (Build.VERSION.SDK_INT < 36 || !context.getSystemService(AccessibilityManager::class.java).isHighContrastTextEnabled)
    }

    override fun definition() = ModuleDefinition {
        Name("AcmeGlassSettings")
        Events("change")
        Function("allowed") { allowed() }
        OnStartObserving("change") {
            if (Build.VERSION.SDK_INT >= 33) {
                val owner = context
                fun changed() = sendEvent("change", mapOf("allowed" to allowed()))
                val receiver = object : BroadcastReceiver() {
                    override fun onReceive(context: Context, intent: Intent) { changed() }
                }
                owner.registerReceiver(receiver, IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED), Context.RECEIVER_NOT_EXPORTED)
                val stopContrast: () -> Unit = if (Build.VERSION.SDK_INT >= 36) {
                    val accessibility = owner.getSystemService(AccessibilityManager::class.java)
                    val listener = AccessibilityManager.HighContrastTextStateChangeListener { changed() }
                    accessibility.addHighContrastTextStateChangeListener(owner.mainExecutor, listener)
                    val remove: () -> Unit = { accessibility.removeHighContrastTextStateChangeListener(listener) }
                    remove
                } else ({})
                stop = { owner.unregisterReceiver(receiver); stopContrast() }
            }
        }
        OnStopObserving("change") { stop?.invoke(); stop = null }
        OnDestroy { stop?.invoke(); stop = null }
    }
}
