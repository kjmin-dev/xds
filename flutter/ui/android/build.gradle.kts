group = "acme.ui"
version = "0.1.0"

plugins {
    id("com.android.library")
}

android {
    namespace = "acme.ui"
    compileSdk = 36
    defaultConfig { minSdk = 24 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
