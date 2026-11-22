// Draws the design preview off screen and writes it as PNG files: `./gradlew :ui:renderPreview`.
// It lives with the tests because it is a way of checking the components, not part of them.
// With `-Pcaptures=<directory>` it draws only the phone screens the documentation shows.

package acme.ui

import acme.tokens.Input
import acme.tokens.Mode
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.unit.Density
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.annotation.DelicateCoilApi
import java.io.File
import java.util.Locale
import kotlin.coroutines.EmptyCoroutineContext
import org.jetbrains.skia.EncodedImageFormat

// Two pixels per dp, like most phones and laptops, so the images are sharp when zoomed.
private const val Scale = 2f

// Replacing the image loader is "delicate" because it must happen before anything asks for one.
// Nothing has here: it is the first thing the program does.
@OptIn(DelicateCoilApi::class)
fun main(args: Array<String>) {
    // Coil loads a picture on other threads, and a frame drawn here does not wait for them.
    // Without a context of its own every step runs where it is asked for, so the pictures the
    // preview embeds are decoded by the time the frame that shows them is drawn.
    SingletonImageLoader.setUnsafe(
        ImageLoader.Builder(PlatformContext.INSTANCE).coroutineContext(EmptyCoroutineContext).build(),
    )

    // The names of months and days, and the day weeks start on, as the web's behavior checks pin
    // them, so the images are the same on every machine.
    Locale.setDefault(Locale.US)

    val directory = File(args.firstOrNull() ?: "build/preview").apply { mkdirs() }
    if ("--captures" in args) return captures(directory)
    fun page(name: String, width: Int, mode: Mode, input: Input, open: PreviewOverlay? = null) {
        val file = File(directory, name)
        draw(file, width, height = null) {
            AcmeTheme(mode, input) { DesignPreviewScreen(onBack = {}, scrolls = false, open = open) }
        }
        println(file)
    }
    page("preview-touch-light.png", 390, Mode.Light, Input.Touch)
    page("preview-touch-dark.png", 390, Mode.Dark, Input.Touch)
    page("preview-pointer-light.png", 900, Mode.Light, Input.Pointer)
    page("preview-pointer-dark.png", 900, Mode.Dark, Input.Pointer)

    // An overlay that covers or sits on a window is drawn in a window the size of a screen
    // rather than of the page: a phone's, or a small desktop window's.
    fun screen(name: String, open: PreviewOverlay, input: Input) {
        val (width, height) = if (input == Input.Touch) 390 to 844 else 900 to 640
        for (mode in Mode.entries) {
            val file = File(directory, "$name-${mode.name.lowercase()}.png")
            draw(file, width, height) {
                AcmeTheme(mode, input) { DesignPreviewScreen(onBack = {}, scrolls = true, open = open) }
            }
            println(file)
        }
    }
    screen("sheet-touch", PreviewOverlay.Sheet, Input.Touch)
    screen("menu-touch", PreviewOverlay.Menu, Input.Touch)
    screen("select-touch", PreviewOverlay.Select, Input.Touch)
    screen("datepicker-touch", PreviewOverlay.DatePicker, Input.Touch)
    screen("daterange-touch", PreviewOverlay.DateRange, Input.Touch)
    screen("dialog-touch", PreviewOverlay.Dialog, Input.Touch)
    screen("dialog-pointer", PreviewOverlay.Dialog, Input.Pointer)
    screen("toast-touch", PreviewOverlay.Toast, Input.Touch)
    screen("toast-pointer", PreviewOverlay.Toast, Input.Pointer)
    // A popup opens under its trigger, far down the page, so the whole page is drawn.
    for (mode in Mode.entries) {
        page("menu-pointer-${mode.name.lowercase()}.png", 900, mode, Input.Pointer, open = PreviewOverlay.Menu)
        page("select-pointer-${mode.name.lowercase()}.png", 900, mode, Input.Pointer, open = PreviewOverlay.Select)
        page("datepicker-pointer-${mode.name.lowercase()}.png", 900, mode, Input.Pointer, open = PreviewOverlay.DatePicker)
        page("daterange-pointer-${mode.name.lowercase()}.png", 900, mode, Input.Pointer, open = PreviewOverlay.DateRange)
    }
}

/**
 * The pictures on the components' documentation pages, which `mise run docs:capture` takes from
 * here, of a phone's screen: the Navigation section at the top, where React Native's preview
 * starts with `?section=navigation`, the sheet open over it, and the Controls section with the
 * calendar of its first date picker open, as `?section=controls&datepicker=1` shows it there,
 * or of its first date range picker, as `?section=controls&daterange=1` does.
 */
private fun captures(directory: File) {
    val screens = listOf(
        Triple("navigation", "navigation", null),
        Triple("sheet", "navigation", PreviewOverlay.Sheet),
        Triple("datepicker", "controls", PreviewOverlay.DatePicker),
        Triple("daterange", "controls", PreviewOverlay.DateRange),
    )
    for (mode in Mode.entries) {
        for (tier in listOf("blur", "solid")) {
            for (sheet in listOf(false, true)) {
                val name = if (sheet) "glass-sheet-$tier" else "glass-$tier"
                val file = File(directory, "$name-${mode.name.lowercase()}.png")
                draw(file, 390, 844) {
                    AcmeTheme(mode, Input.Touch) {
                        DesignPreviewScreen(onBack = {}, scrolls = true, open = if (sheet) PreviewOverlay.Sheet else null, from = "glass", glass = tier)
                    }
                }
            }
        }
        for ((name, from, open) in screens) {
            val file = File(directory, "$name-${mode.name.lowercase()}.png")
            draw(file, 390, 844) {
                AcmeTheme(mode, Input.Touch) {
                    DesignPreviewScreen(onBack = {}, scrolls = true, open = open, from = from)
                }
            }
            println(file)
        }
    }
}

/** Draws [content] at [width] dp. Without a [height] the image is as tall as the content. */
private fun draw(file: File, width: Int, height: Int?, content: @Composable () -> Unit) {
    val pixels = (width * Scale).toInt()
    val tall = height?.let { (it * Scale).toInt() } ?: measureHeight(pixels, content)
    val scene = ImageComposeScene(pixels, tall, Density(Scale), content = content)
    try {
        // Half a second of frames, so what animates on appearing has settled: the sheet slides
        // in, the dialog and the toast fade in. Each frame's image is closed before the next is
        // drawn: while one is open, drawing copies every pixel for it, in Skia's memory, which
        // the JVM does not count and frees late. The whole preview at a desktop width is 175 MB
        // a frame; left open, the frames took the renderer to nearly twice the memory, and a CI
        // runner on Linux stopped while it drew.
        var image = scene.render()
        for (frame in 1..30) {
            image.close()
            image = scene.render(nanoTime = frame * 16_000_000L)
        }
        try {
            file.writeBytes(image.encodeToData(EncodedImageFormat.PNG)!!.bytes)
        } finally {
            image.close()
        }
    } finally {
        scene.close()
    }
}

/** The height in pixels that [content] takes when nothing limits it. */
private fun measureHeight(pixels: Int, content: @Composable () -> Unit): Int {
    var measured = 0
    val scene = ImageComposeScene(pixels, 1, Density(Scale)) {
        Box(Modifier.wrapContentHeight(Alignment.Top, unbounded = true).onSizeChanged { measured = it.height }) {
            content()
        }
    }
    try {
        scene.render().close()
    } finally {
        scene.close()
    }
    return measured
}
