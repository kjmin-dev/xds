package acme.ui

import acme.tokens.Border
import acme.tokens.Glass
import acme.tokens.Shadow
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeInput
import dev.chrisbanes.haze.HazePerformanceMode
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.blur.HazeBlurStyle
import dev.chrisbanes.haze.blur.HazeColorEffect
import dev.chrisbanes.haze.blur.hazeBlur
import dev.chrisbanes.haze.hazeSource

enum class Surface { Solid, Glass }

private class GlassState {
    val haze = HazeState()
    var backdrops by mutableIntStateOf(0)
}

private val LocalGlass = staticCompositionLocalOf<GlassState?> { null }
private val LocalBlur = staticCompositionLocalOf { false }
internal val LocalPreviewBlur = staticCompositionLocalOf<Boolean?> { null }

@Composable
internal expect fun systemAllowsBlur(): Boolean

/** Scopes backdrop reads to one screen. Mark its content with [glassBackdrop] and draw the bars as siblings. */
@Composable
fun GlassScene(content: @Composable () -> Unit) {
    val state = remember { GlassState() }
    val allowed = systemAllowsBlur() && LocalPreviewBlur.current != false
    CompositionLocalProvider(LocalGlass provides state, LocalBlur provides allowed, content = content)
}

@Composable
fun Modifier.glassBackdrop(): Modifier {
    val state = LocalGlass.current ?: return this
    if (!LocalBlur.current) return this
    DisposableEffect(state) {
        state.backdrops++
        onDispose { state.backdrops-- }
    }
    return hazeSource(state.haze)
}

@Composable
internal fun hasBlurredBackdrop(): Boolean = LocalBlur.current && (LocalGlass.current?.backdrops ?: 0) > 0

@Composable
internal fun Modifier.glassSurface(shape: Shape, sheet: Boolean = false): Modifier {
    val colors = LocalColors.current
    val state = LocalGlass.current
    val shadow = if (sheet) Shadow.overlay else Shadow.raised
    val frame = shadow(shadow.copy(color = colors.glassShadow), shape).clip(shape)
    val glass = Glass
    val fill = if (state != null && hasBlurredBackdrop()) {
        val style = remember(colors, glass, sheet) {
            HazeBlurStyle {
                blurRadius((glass.blur - 0.5.dp) / 0.57735f)
                noiseFactor(0f)
                backgroundColor(colors.glassFallback)
                colorEffects(buildList {
                    // The source is in the page behind the modal window, below its scrim.
                    if (sheet) add(HazeColorEffect.tint(colors.scrim))
                    add(HazeColorEffect.colorFilter(ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(glass.saturation) })))
                    add(HazeColorEffect.tint(if (sheet) colors.glassTintStrong else colors.glassTint))
                    add(HazeColorEffect.tint(Brush.verticalGradient(0f to colors.glassHighlight, 0.5f to Color.Transparent)))
                })
                fallbackColorEffect(HazeColorEffect.tint(colors.glassFallback))
            }
        }
        // Sample at half resolution in each dimension. Only the backdrop is downscaled;
        // labels and icons draw at display resolution on top of it.
        frame.hazeBlur(HazeInput.Backdrop(state.haze), style, performanceMode = HazePerformanceMode.Performance)
    } else frame.background(colors.glassFallback)
    return fill.border(Border.widthThin, colors.glassBorder, shape)
}
