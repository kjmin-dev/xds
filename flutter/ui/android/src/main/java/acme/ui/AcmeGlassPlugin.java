package acme.ui;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.PowerManager;
import android.view.accessibility.AccessibilityManager;
import androidx.annotation.NonNull;
import io.flutter.embedding.engine.plugins.FlutterPlugin;
import io.flutter.plugin.common.EventChannel;

/** Publishes in-app blur eligibility while at least one glass surface is listening. */
public final class AcmeGlassPlugin implements FlutterPlugin, EventChannel.StreamHandler {
    private Context context;
    private EventChannel channel;
    private EventChannel.EventSink events;
    private BroadcastReceiver receiver;
    private Runnable stopContrast;

    @Override public void onAttachedToEngine(@NonNull FlutterPluginBinding binding) {
        context = binding.getApplicationContext();
        channel = new EventChannel(binding.getBinaryMessenger(), "acme.ui/glass");
        channel.setStreamHandler(this);
    }

    private void publish() {
        if (events == null) return;
        events.success(Build.VERSION.SDK_INT >= 33 &&
            !context.getSystemService(ActivityManager.class).isLowRamDevice() &&
            !context.getSystemService(PowerManager.class).isPowerSaveMode() &&
            (Build.VERSION.SDK_INT < 36 || !context.getSystemService(AccessibilityManager.class).isHighContrastTextEnabled()));
    }

    @Override public void onListen(Object arguments, EventChannel.EventSink sink) {
        events = sink;
        if (Build.VERSION.SDK_INT >= 33) {
            receiver = new BroadcastReceiver() {
                @Override public void onReceive(Context owner, Intent intent) { publish(); }
            };
            context.registerReceiver(receiver, new IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED), Context.RECEIVER_NOT_EXPORTED);
            if (Build.VERSION.SDK_INT >= 36) {
                AccessibilityManager accessibility = context.getSystemService(AccessibilityManager.class);
                AccessibilityManager.HighContrastTextStateChangeListener listener = ignored -> publish();
                accessibility.addHighContrastTextStateChangeListener(context.getMainExecutor(), listener);
                stopContrast = () -> accessibility.removeHighContrastTextStateChangeListener(listener);
            }
        }
        publish();
    }

    @Override public void onCancel(Object arguments) {
        if (receiver != null) context.unregisterReceiver(receiver);
        if (stopContrast != null) stopContrast.run();
        receiver = null;
        stopContrast = null;
        events = null;
    }

    @Override public void onDetachedFromEngine(@NonNull FlutterPluginBinding binding) {
        onCancel(null);
        channel.setStreamHandler(null);
        channel = null;
        context = null;
    }
}
