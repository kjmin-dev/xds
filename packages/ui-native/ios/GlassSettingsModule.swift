import ExpoModulesCore
import UIKit

public final class GlassSettingsModule: Module {
  private var observers: [NSObjectProtocol] = []

  private func allowed() -> Bool {
    !UIAccessibility.isReduceTransparencyEnabled &&
      !UIAccessibility.isDarkerSystemColorsEnabled &&
      !ProcessInfo.processInfo.isLowPowerModeEnabled
  }

  public func definition() -> ModuleDefinition {
    Name("AcmeGlassSettings")
    Events("change")
    Function("allowed") { self.allowed() }
    OnStartObserving("change") {
      let center = NotificationCenter.default
      self.observers = [
        UIAccessibility.reduceTransparencyStatusDidChangeNotification,
        UIAccessibility.darkerSystemColorsStatusDidChangeNotification,
        Notification.Name.NSProcessInfoPowerStateDidChange,
      ].map { name in
        center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
          guard let self else { return }
          self.sendEvent("change", ["allowed": self.allowed()])
        }
      }
    }
    OnStopObserving("change") { self.removeObservers() }
    OnDestroy { self.removeObservers() }
  }

  private func removeObservers() {
    for observer in observers { NotificationCenter.default.removeObserver(observer) }
    observers.removeAll()
  }
}
