// Draws the design preview off screen and writes it as PNG files: `./gradlew :ui:renderPreview`.
// It lives with the tests because it is a way of checking the components, not part of them.

package acme.ui

import acme.tokens.Mode
import acme.tokens.PointerSizes
import acme.tokens.Sizes
import acme.tokens.TouchSizes
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

    val directory = File(args.firstOrNull() ?: "build/preview").apply { mkdirs() }
    fun page(name: String, width: Int, mode: Mode, sizes: Sizes, open: PreviewOverlay? = null) {
        val file = File(directory, name)
        draw(file, width, height = null) {
            AcmeTheme(mode, sizes) { DesignPreviewScreen(onBack = {}, scrolls = false, open = open) }
        }
        println(file)
    }
    page("preview-touch-light.png", 390, Mode.Light, TouchSizes)
    page("preview-touch-dark.png", 390, Mode.Dark, TouchSizes)
    page("preview-pointer-light.png", 900, Mode.Light, PointerSizes)
    page("preview-pointer-dark.png", 900, Mode.Dark, PointerSizes)

    // An overlay that covers or sits on a window is drawn in a window the size of a screen
    // rather than of the page: a phone's, or a small desktop window's.
    fun screen(name: String, open: PreviewOverlay, sizes: Sizes) {
        val (width, height) = if (sizes === TouchSizes) 390 to 844 else 900 to 640
        for (mode in Mode.entries) {
            val file = File(directory, "$name-${mode.name.lowercase()}.png")
            draw(file, width, height) {
                AcmeTheme(mode, sizes) { DesignPreviewScreen(onBack = {}, scrolls = true, open = open) }
            }
            println(file)
        }
    }
    screen("sheet-touch", PreviewOverlay.Sheet, TouchSizes)
    screen("menu-touch", PreviewOverlay.Menu, TouchSizes)
    screen("select-touch", PreviewOverlay.Select, TouchSizes)
    screen("dialog-touch", PreviewOverlay.Dialog, TouchSizes)
    screen("dialog-pointer", PreviewOverlay.Dialog, PointerSizes)
    screen("toast-touch", PreviewOverlay.Toast, TouchSizes)
    screen("toast-pointer", PreviewOverlay.Toast, PointerSizes)
    // A popup opens under its trigger, far down the page, so the whole page is drawn.
    for (mode in Mode.entries) {
        page("menu-pointer-${mode.name.lowercase()}.png", 900, mode, PointerSizes, open = PreviewOverlay.Menu)
        page("select-pointer-${mode.name.lowercase()}.png", 900, mode, PointerSizes, open = PreviewOverlay.Select)
    }
}

/** Draws [content] at [width] dp. Without a [height] the image is as tall as the content. */
private fun draw(file: File, width: Int, height: Int?, content: @Composable () -> Unit) {
    val pixels = (width * Scale).toInt()
    val tall = height?.let { (it * Scale).toInt() } ?: measureHeight(pixels, content)
    val scene = ImageComposeScene(pixels, tall, Density(Scale), content = content)
    try {
        // Half a second of frames, so what animates on appearing has settled: the sheet slides
        // in, the dialog and the toast fade in.
        var image = scene.render()
        for (frame in 1..30) image = scene.render(nanoTime = frame * 16_000_000L)
        file.writeBytes(image.encodeToData(EncodedImageFormat.PNG)!!.bytes)
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
        scene.render()
    } finally {
        scene.close()
    }
    return measured
}
