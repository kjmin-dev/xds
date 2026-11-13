import Shared
import SwiftUI
import UIKit

/// The whole app is drawn by Compose: this wraps the view controller that `shared` builds.
struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        // Compose draws under the status bar and the home indicator, and keeps its own content
        // clear of them.
        ComposeView()
            .ignoresSafeArea()
    }
}
