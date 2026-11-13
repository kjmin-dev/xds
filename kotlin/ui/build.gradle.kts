import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidMultiplatformLibrary)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
}

kotlin {
    iosArm64()
    iosSimulatorArm64()

    jvm()

    android {
        namespace = "com.example.acme.ui"
        compileSdk = libs.versions.android.compileSdk.get().toInt()
        minSdk = libs.versions.android.minSdk.get().toInt()

        compilerOptions {
            jvmTarget = JvmTarget.JVM_11
        }
        // The common tests also run against the Android build of the library, on this machine.
        withHostTest {}
    }

    sourceSets {
        commonMain.dependencies {
            // No Material library: the look comes from the tokens, so the components are drawn
            // on the same bare primitives as the React Native ones.
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.ui)
        }
        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
        jvmTest.dependencies {
            // Skia's native library for this machine, which drawing off screen needs.
            implementation(compose.desktop.currentOs)
        }
    }
}

// Draws the whole design preview off screen and writes it as PNG files, so the components can be
// looked at without starting an app.
tasks.register<JavaExec>("renderPreview") {
    group = "verification"
    description = "Writes PNG images of the design preview to build/preview"
    val test = kotlin.jvm().compilations["test"]
    classpath = files(test.output.allOutputs, test.runtimeDependencyFiles)
    mainClass = "acme.ui.RenderPreviewKt"
    val output = rootProject.layout.buildDirectory.dir("preview")
    outputs.dir(output)
    argumentProviders.add { listOf(output.get().asFile.path) }
    systemProperty("java.awt.headless", "true")
}
