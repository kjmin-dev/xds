import Flutter
import UIKit

public final class AcmeGlassPlugin: NSObject, FlutterPlugin, FlutterStreamHandler {
    private var observers: [NSObjectProtocol] = []
    private var sink: FlutterEventSink?

    public static func register(with registrar: FlutterPluginRegistrar) {
        let plugin = AcmeGlassPlugin()
        let channel = FlutterEventChannel(name: "acme.ui/glass", binaryMessenger: registrar.messenger())
        channel.setStreamHandler(plugin)
    }

    private func publish() {
        sink?(!UIAccessibility.isReduceTransparencyEnabled &&
              !UIAccessibility.isDarkerSystemColorsEnabled &&
              !ProcessInfo.processInfo.isLowPowerModeEnabled)
    }

    public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        sink = events
        observers = [UIAccessibility.reduceTransparencyStatusDidChangeNotification,
                     UIAccessibility.darkerSystemColorsStatusDidChangeNotification,
                     .NSProcessInfoPowerStateDidChange].map { name in
            NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.publish()
            }
        }
        publish()
        return nil
    }

    public func onCancel(withArguments arguments: Any?) -> FlutterError? {
        observers.forEach(NotificationCenter.default.removeObserver)
        observers.removeAll()
        sink = nil
        return nil
    }

    deinit { observers.forEach(NotificationCenter.default.removeObserver) }
}
