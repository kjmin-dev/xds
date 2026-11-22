// The Compose library's external consumer check: what must pass before the library joins a
// release (docs/library.md, L2).
//
//   node maven/consumer.ts [--platforms desktop,android,ios] [--skip-build] [--xds <binary>]
//
// It builds the library into a Maven repository directory with build.ts, then consumes it from
// new Gradle projects outside this repository, which have nothing of xds's but the dependency on
// io.github.kjmin-dev:xds-ui from that directory:
//
// - desktop: a Compose desktop app that draws every page and overlay of the design preview off
//   screen, with the same program a scaffolded project runs as `./gradlew :ui:renderPreview`;
// - android: an Android app that shows the design preview the way a scaffolded project's Android
//   app does, opened at each section, on an emulator that this run makes and deletes;
// - ios (macOS only): a Kotlin Multiplatform module that puts the design preview in a
//   UIViewController, as a scaffolded project's `shared` module does for its Xcode app, linked
//   into a framework for the simulator and for devices. It shows the iOS artifacts resolve and
//   link; it draws nothing.
//
// Each picture is compared, pixel for pixel, with the scaffolded project's: the project that
// `xds create` makes from this repository under the name `xds`, as the library is named, in both
// color modes. Once with the default theme, and once with a custom theme (npm/web/consumer/
// brand.json, which the web library's check uses too): the library's apps apply it with the value
// `xds export-theme --format compose` writes, and the scaffolded project with its token build.
//
// `--xds <binary>` names the CLI to scaffold and export with; by default it is built from this
// repository. Android needs the Android SDK at $ANDROID_HOME with a system image installed.

import { copyFile, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { releaseVersion } from "../npm/release-version.ts";
import { emitKotlin } from "../tools/design-build/src/emit.ts";
import { loadIcons } from "../tools/design-build/src/icons.ts";
import { readContract, themeModel } from "../tools/design-build/src/theme-contract.ts";
import { ARTIFACT, buildLibrary, GROUP, gradlew, root, run, scaffold, xdsBinary } from "./build.ts";
import { type Emulator, startEmulator } from "./emulator.ts";
import { decodePng, differingPixels, isBlank } from "./png.ts";

type Platform = "desktop" | "android" | "ios";
type Theme = "default" | "brand";
const THEMES: Theme[] = ["default", "brand"];

const { values: options } = parseArgs({
  options: {
    platforms: {
      type: "string",
      default: process.platform === "darwin" ? "desktop,android,ios" : "desktop,android",
    },
    "skip-build": { type: "boolean", default: false },
    xds: { type: "string" },
  },
});
const platforms = options.platforms.split(",") as Platform[];
const work = join(tmpdir(), "xds-maven-consumer");
const out = join(tmpdir(), "xds-maven-consumer-compare");
const dist = join(root, "maven/dist");
const themeFile = join(root, "npm/web/consumer/brand.json");

// ----------------------------------------------------------------------------- the projects

/** What every consumer project shares: the scaffold's Gradle wrapper and version catalog. */
async function gradleProject(dir: string, reference: string, name: string, repository: string) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, "gradle"), { recursive: true });
  for (const file of ["gradlew", "gradlew.bat"])
    await copyFile(join(reference, file), join(dir, file));
  await cp(join(reference, "gradle/wrapper"), join(dir, "gradle/wrapper"), { recursive: true });
  await copyFile(
    join(reference, "gradle/libs.versions.toml"),
    join(dir, "gradle/libs.versions.toml"),
  );
  await writeFile(
    join(dir, "gradle.properties"),
    [
      "org.gradle.jvmargs=-Xmx4096M -Dfile.encoding=UTF-8",
      "kotlin.code.style=official",
      "android.useAndroidX=true",
      "android.nonTransitiveRClass=true",
      "",
    ].join("\n"),
  );
  const google = `google {
            mavenContent {
                includeGroupAndSubgroups("androidx")
                includeGroupAndSubgroups("com.android")
                includeGroupAndSubgroups("com.google")
            }
        }`;
  await writeFile(
    join(dir, "settings.gradle.kts"),
    `rootProject.name = "${name}"

pluginManagement {
    repositories {
        ${google}
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        // The library as maven/build.ts wrote it, as Maven Central will serve it.
        maven {
            url = uri("${repository}")
            mavenContent { includeGroup("${GROUP}") }
        }
        ${google}
        mavenCentral()
    }
}
`,
  );
}

/** The custom theme as the library's apps take it: the Kotlin value `xds export-theme` writes. */
function exportTheme(xds: string, file: string) {
  // Run outside any project, so it is written for the published library's types.
  run(
    xds,
    [
      "export-theme",
      themeFile,
      "--name",
      "brand",
      "--format",
      "compose",
      "--package",
      "xds.consumer",
      "--out",
      file,
    ],
    work,
  );
}

/**
 * A desktop app that draws the preview with the scaffold's own renderer. It is the scaffold's
 * RenderPreview.kt, with one change: each theme composable it calls gets the theme to draw with.
 */
async function desktopConsumer(
  xds: string,
  reference: string,
  repository: string,
  version: string,
) {
  const dir = join(work, "desktop");
  await gradleProject(dir, reference, "xds-consumer-desktop", repository);
  await writeFile(
    join(dir, "build.gradle.kts"),
    `plugins {
    alias(libs.plugins.kotlinJvm)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
}

dependencies {
    implementation("${GROUP}:${ARTIFACT}:${version}")
    implementation(compose.desktop.currentOs)
    // The renderer sets up the image loader the library draws pictures with.
    implementation(libs.coil.compose)
}

tasks.register<JavaExec>("renderPreview") {
    classpath = sourceSets["main"].runtimeClasspath
    mainClass = "xds.ui.RenderPreviewKt"
    args(providers.gradleProperty("out").get())
    systemProperty("xds.consumer.theme", providers.gradleProperty("theme").getOrElse("default"))
    systemProperty("java.awt.headless", "true")
}
`,
  );
  const sources = join(dir, "src/main/kotlin");
  await mkdir(join(sources, "xds/ui"), { recursive: true });
  await mkdir(join(sources, "xds/consumer"), { recursive: true });
  const renderer = await readFile(
    join(reference, "ui/src/jvmTest/kotlin/xds/ui/RenderPreview.kt"),
    "utf8",
  );
  let themed = 0;
  const given = renderer.replace(/XdsTheme\(mode, ([\w.]+)\)/g, (_, input: string) => {
    themed++;
    return `XdsTheme(mode, ${input}, consumerTheme)`;
  });
  if (themed === 0 || /XdsTheme\((?!mode, [\w.]+, consumerTheme\))/.test(given)) {
    throw new Error(
      "RenderPreview.kt calls XdsTheme in a way this check does not know how to give a theme to",
    );
  }
  await writeFile(join(sources, "xds/ui/RenderPreview.kt"), given);
  await writeFile(
    join(sources, "xds/ui/ConsumerTheme.kt"),
    `package xds.ui

import xds.consumer.BrandTheme
import xds.tokens.DefaultTheme
import xds.tokens.Theme

/** The theme the pictures are drawn with: the library's own, or the custom one the check gives. */
val consumerTheme: Theme = if (System.getProperty("xds.consumer.theme") == "brand") BrandTheme else DefaultTheme
`,
  );
  exportTheme(xds, join(sources, "xds/consumer/BrandTheme.kt"));
  return dir;
}

/** An Android app that shows the preview as the scaffolded project's Android app does. */
async function androidConsumer(
  xds: string,
  reference: string,
  repository: string,
  version: string,
) {
  const dir = join(work, "android");
  await gradleProject(dir, reference, "xds-consumer-android", repository);
  await writeFile(
    join(dir, "settings.gradle.kts"),
    `${await readFile(join(dir, "settings.gradle.kts"), "utf8")}\ninclude(":app")\n`,
  );
  const app = join(dir, "app");
  await mkdir(join(app, "src/main/kotlin/xds/consumer"), { recursive: true });
  // As the scaffolded Android app is built, with the library in place of the project's modules.
  await writeFile(
    join(app, "build.gradle.kts"),
    `import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeCompiler)
}

dependencies {
    implementation("${GROUP}:${ARTIFACT}:${version}")
    implementation(libs.androidx.activity.compose)
    coreLibraryDesugaring(libs.desugar.jdk.libs)
}

android {
    namespace = "xds.consumer"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "xds.consumer"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 1
        versionName = "1.0"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_11
    }
}
`,
  );
  await writeFile(
    join(app, "src/main/AndroidManifest.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:label="xds consumer"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name="xds.consumer.MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  );
  await writeFile(
    join(app, "src/main/kotlin/xds/consumer/MainActivity.kt"),
    `package xds.consumer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import xds.tokens.DefaultTheme
import xds.ui.DesignPreview
import xds.ui.XdsTheme

/** The design preview, opened as the scaffolded app opens it, with the theme the check gives. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val theme = if (intent.getStringExtra("theme") == "brand") BrandTheme else DefaultTheme
        setContent {
            XdsTheme(theme = theme) {
                DesignPreview(
                    section = intent.getStringExtra("section"),
                    glass = intent.getStringExtra("glass"),
                    autoscroll = false,
                    sheet = intent.getBooleanExtra("sheet", false),
                    onBack = {},
                )
            }
        }
    }
}
`,
  );
  exportTheme(xds, join(app, "src/main/kotlin/xds/consumer/BrandTheme.kt"));
  return dir;
}

/**
 * A Kotlin Multiplatform module for iOS that shows the design preview with the theme a launch
 * argument names, as a scaffolded project's `shared` module does for its Xcode app.
 */
async function iosConsumer(xds: string, reference: string, repository: string, version: string) {
  const dir = join(work, "ios");
  await gradleProject(dir, reference, "xds-consumer-ios", repository);
  await writeFile(
    join(dir, "build.gradle.kts"),
    `plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
}

kotlin {
    listOf(iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "Consumer"
            isStatic = true
        }
    }
    sourceSets {
        commonMain.dependencies {
            implementation("${GROUP}:${ARTIFACT}:${version}")
        }
    }
}
`,
  );
  const sources = join(dir, "src/iosMain/kotlin/xds/consumer");
  await mkdir(sources, { recursive: true });
  await writeFile(
    join(sources, "MainViewController.kt"),
    `package xds.consumer

import androidx.compose.ui.window.ComposeUIViewController
import platform.Foundation.NSProcessInfo
import xds.tokens.DefaultTheme
import xds.ui.DesignPreview
import xds.ui.XdsTheme

/** What a Swift app would put on screen: the design preview, with the theme it is given. */
fun MainViewController() = ComposeUIViewController {
    val args = NSProcessInfo.processInfo.arguments.filterIsInstance<String>()
    XdsTheme(theme = if ("--brand" in args) BrandTheme else DefaultTheme) {
        DesignPreview(onBack = {})
    }
}
`,
  );
  exportTheme(xds, join(sources, "BrandTheme.kt"));
  return dir;
}

// ----------------------------------------------------------------------------- comparing

let differences = 0;

/** Compares two sets of pictures by name; a picture that differs is kept, both sides of it. */
async function compare(
  label: string,
  scaffolded: Map<string, Buffer>,
  library: Map<string, Buffer>,
) {
  const where = join(out, label.replaceAll(/\W+/g, "-"));
  let differ = 0;
  for (const [name, picture] of scaffolded) {
    const other = library.get(name);
    if (other?.equals(picture)) continue;
    // The same pixels may be encoded differently; only the pixels count.
    const pixels = other && differingPixels(decodePng(picture), decodePng(other));
    if (pixels === 0) continue;
    differ++;
    await mkdir(where, { recursive: true });
    await writeFile(join(where, `scaffold-${name}`), picture);
    if (other) await writeFile(join(where, `library-${name}`), other);
    const how = !other
      ? "is missing"
      : pixels === undefined
        ? "differs in size"
        : `differs in ${pixels} pixels`;
    console.log(`  ${label}: ${name} ${how}`);
  }
  for (const name of library.keys()) {
    if (!scaffolded.has(name)) {
      differ++;
      console.log(`  ${label}: ${name} is drawn by the library only`);
    }
  }
  differences += differ;
  console.log(`${label}: ${scaffolded.size} pictures compared, ${differ} differ`);
}

/**
 * Fails the run when the custom theme changed none of the library's pictures: the comparison
 * would then show only that both sides ignore it.
 */
function checkThemed(label: string, drawn: Map<Theme, Map<string, Buffer>>) {
  const plain = drawn.get("default") ?? new Map<string, Buffer>();
  const branded = drawn.get("brand") ?? new Map<string, Buffer>();
  const same = [...plain].filter(([name, picture]) => branded.get(name)?.equals(picture));
  console.log(
    `${label}: the custom theme changes ${plain.size - same.length} of ${plain.size} pictures`,
  );
  if (same.length === plain.size) {
    differences++;
    console.log(`  ${label}: the custom theme changed nothing`);
  }
}

async function pictures(dir: string): Promise<Map<string, Buffer>> {
  const found = new Map<string, Buffer>();
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".png")).sort()) {
    found.set(name, await readFile(join(dir, name)));
  }
  return found;
}

// ----------------------------------------------------------------------------- Android

/**
 * Each screen the Android pictures show: the preview opened at each section, as `section`
 * opens it in the scaffolded app, the sheet open over the navigation section, and the glass
 * section in both of its tiers.
 */
async function androidScreens(reference: string): Promise<{ name: string; extras: string[] }[]> {
  const preview = await readFile(
    join(reference, "ui/src/commonMain/kotlin/xds/ui/DesignPreview.kt"),
    "utf8",
  );
  const keys = [...preview.matchAll(/^ {20}"([a-z-]+)" to \{/gm)].map((match) => match[1] ?? "");
  if (keys.length < 10)
    throw new Error("DesignPreview.kt lists its sections in a way this check does not read");
  return [
    ...keys.map((key) => ({ name: key, extras: ["--es", "section", key] })),
    {
      name: "navigation-sheet",
      extras: ["--es", "section", "navigation", "--ez", "sheet", "true"],
    },
    { name: "glass-solid", extras: ["--es", "section", "glass", "--es", "glass", "solid"] },
  ];
}

/**
 * Opens a screen afresh and waits until it stops changing: two pictures in a row the same. A
 * picture's decoding and the first frames of a sheet land a moment after the app starts.
 */
async function shoot(emulator: Emulator, component: string, extras: string[]): Promise<Buffer> {
  const [app = component, activity = component] = component.split("/");
  emulator.adb(["shell", "am", "force-stop", app]);
  try {
    // Waits for the launch to finish. Now and then the system takes too long to report it and
    // the command fails although the app starts; what follows waits for the screen anyway.
    emulator.adb(["shell", "am", "start", "-W", "-n", component, ...extras]);
  } catch {
    console.log(`  ${component} ${extras.join(" ")}: the launch was not reported`);
  }
  // A picture counts once the activity's window has the focus, the system's splash window for
  // the app is gone, and the screen shows more than one color. The splash, or a blank screen
  // between the old process and the new one's first frame, would match the same screen of the
  // other app and hide a difference.
  const ready = (picture: Buffer) => {
    if (isBlank(decodePng(picture))) return false;
    const windows = emulator.adb(["shell", "dumpsys", "window"]).toString();
    return (
      !windows.includes(`Splash Screen ${app}`) &&
      (windows.match(/mCurrentFocus=.*/)?.[0].includes(activity) ?? false)
    );
  };
  await sleep(1500);
  let last = emulator.screenshot();
  for (let tries = 0; tries < 30; tries++) {
    await sleep(700);
    const next = emulator.screenshot();
    if (next.equals(last) && ready(next)) return next;
    last = next;
  }
  throw new Error(`${component} ${extras.join(" ")} did not settle on a drawn screen`);
}

const SCAFFOLD_APP = "com.example.xds/xds.app.MainActivity";
const LIBRARY_APP = "xds.consumer/xds.consumer.MainActivity";

/**
 * Each screen of the scaffolded app with the theme its build was given, and the same screen of
 * the library's app told to take that theme, one right after the other. A pair that differs is
 * taken again, twice at most, before it counts: a picture that the app decodes while the screen
 * is drawn can land a frame apart from one launch to the next.
 */
async function androidPictures(
  emulator: Emulator,
  theme: Theme,
  screens: { name: string; extras: string[] }[],
): Promise<{ scaffolded: Map<string, Buffer>; library: Map<string, Buffer> }> {
  const scaffolded = new Map<string, Buffer>();
  const library = new Map<string, Buffer>();
  for (const mode of ["light", "dark"]) {
    emulator.adb(["shell", "cmd", "uimode", "night", mode === "dark" ? "yes" : "no"]);
    await sleep(1500);
    for (const screen of screens) {
      const name = `${screen.name}-${mode}.png`;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const reference = await shoot(emulator, SCAFFOLD_APP, screen.extras);
        const drawn = await shoot(emulator, LIBRARY_APP, [
          ...screen.extras,
          "--es",
          "theme",
          theme,
        ]);
        scaffolded.set(name, reference);
        library.set(name, drawn);
        if (
          drawn.equals(reference) ||
          differingPixels(decodePng(drawn), decodePng(reference)) === 0
        )
          break;
        if (attempt < 3) console.log(`  android, ${theme} theme: ${name} differs; taken again`);
      }
    }
  }
  return { scaffolded, library };
}

// ----------------------------------------------------------------------------- the run

const version = await releaseVersion(root);
const xds = xdsBinary(options.xds);
const repository = options["skip-build"] ? join(dist, "repository") : await buildLibrary(dist, xds);
await rm(work, { recursive: true, force: true });
await rm(out, { recursive: true, force: true });
await mkdir(work, { recursive: true });

// The scaffolded project, named as the library is, and the custom theme as its token build
// writes it.
const project = join(work, "scaffold");
await scaffold(xds, project);
const reference = join(project, "kotlin");
const tokensFile = join(reference, "ui/src/commonMain/kotlin/xds/tokens/Tokens.kt");
const defaultTokens = await readFile(tokensFile, "utf8");
const contract = await readContract(project);
const brandModel = await themeModel(
  project,
  JSON.parse(await readFile(themeFile, "utf8")),
  contract,
);
brandModel.icons = await loadIcons(join(project, "design/icons"));
const brandTokens = emitKotlin(brandModel, "xds.tokens");

// What the scaffolded project draws, with each theme.
const scaffolded = {
  desktop: new Map<Theme, Map<string, Buffer>>(),
  android: new Map<Theme, string>(),
};
for (const theme of THEMES) {
  await writeFile(tokensFile, theme === "brand" ? brandTokens : defaultTokens);
  const tasks = [];
  if (platforms.includes("desktop")) tasks.push(":ui:renderPreview");
  if (platforms.includes("android")) tasks.push(":androidApp:assembleDebug");
  if (tasks.length > 0)
    run(gradlew(reference), [...tasks, "--console=plain", "--quiet"], reference);
  if (platforms.includes("desktop")) {
    scaffolded.desktop.set(theme, await pictures(join(reference, "build/preview")));
  }
  if (platforms.includes("android")) {
    const apk = join(work, `scaffold-${theme}.apk`);
    await copyFile(join(reference, "androidApp/build/outputs/apk/debug/androidApp-debug.apk"), apk);
    scaffolded.android.set(theme, apk);
  }
}
await writeFile(tokensFile, defaultTokens);

if (platforms.includes("desktop")) {
  const dir = await desktopConsumer(xds, reference, repository, version);
  const drawn = new Map<Theme, Map<string, Buffer>>();
  for (const theme of THEMES) {
    const pictureDir = join(work, "desktop-pictures", theme);
    await mkdir(pictureDir, { recursive: true });
    run(
      gradlew(dir),
      ["renderPreview", `-Pout=${pictureDir}`, `-Ptheme=${theme}`, "--console=plain", "--quiet"],
      dir,
    );
    drawn.set(theme, await pictures(pictureDir));
    await compare(
      `desktop, ${theme} theme`,
      scaffolded.desktop.get(theme) ?? new Map(),
      drawn.get(theme) ?? new Map(),
    );
  }
  checkThemed("desktop", drawn);
}

if (platforms.includes("android")) {
  const dir = await androidConsumer(xds, reference, repository, version);
  run(gradlew(dir), [":app:assembleDebug", "--console=plain", "--quiet"], dir);
  const apk = join(dir, "app/build/outputs/apk/debug/app-debug.apk");
  const screens = await androidScreens(reference);
  const log = join(work, "emulator.log");
  await mkdir(dirname(log), { recursive: true });
  const emulator = await startEmulator(work, log);
  try {
    const drawn = new Map<Theme, Map<string, Buffer>>();
    // Both apps are installed side by side; the scaffolded one is built once per theme.
    emulator.adb(["install", "-r", "-t", apk]);
    for (const theme of THEMES) {
      emulator.adb(["install", "-r", "-t", scaffolded.android.get(theme) ?? ""]);
      const pictures = await androidPictures(emulator, theme, screens);
      drawn.set(theme, pictures.library);
      await compare(`android, ${theme} theme`, pictures.scaffolded, pictures.library);
    }
    checkThemed("android", drawn);
  } finally {
    emulator.stop();
  }
}

if (platforms.includes("ios")) {
  const dir = await iosConsumer(xds, reference, repository, version);
  run(
    gradlew(dir),
    [
      "linkDebugFrameworkIosSimulatorArm64",
      "linkReleaseFrameworkIosArm64",
      "--console=plain",
      "--quiet",
    ],
    dir,
  );
  console.log("ios: the frameworks for the simulator and for devices link against the library");
}

const drawn = platforms.filter((platform) => platform !== "ios");
const passed = [
  drawn.length > 0
    ? `draws the design preview as the scaffolded project does on ${drawn.join(" and ")}, with the default theme and a custom one`
    : "",
  platforms.includes("ios") ? "links into iOS frameworks" : "",
].filter(Boolean);
console.log(
  differences === 0
    ? `${GROUP}:${ARTIFACT} ${version} ${passed.join(", and ")}.`
    : `${differences} pictures differ. Both sides of each are in ${out}.`,
);
process.exitCode = differences === 0 ? 0 : 1;
