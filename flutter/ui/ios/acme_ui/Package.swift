// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "acme_ui",
    platforms: [.iOS("15.0")],
    products: [.library(name: "acme-ui", targets: ["acme_ui"])],
    dependencies: [.package(name: "FlutterFramework", path: "../FlutterFramework")],
    targets: [.target(name: "acme_ui", dependencies: [
        .product(name: "FlutterFramework", package: "FlutterFramework")
    ])]
)
