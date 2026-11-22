// The hand-written half of the tokens: the types and helpers the generated Tokens.kt refers to.

package acme.tokens

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

/** A color mode. Each one has a full set of color tokens. */
enum class Mode { Light, Dark }

/** How the person points at the screen. Each one has a full set of sizes. */
enum class Input { Pointer, Touch }

/** The color tokens of a mode. */
fun Theme.colors(mode: Mode): Colors = when (mode) {
    Mode.Light -> light
    Mode.Dark -> dark
}

/** The sizes for an input device. */
fun Theme.sizes(input: Input): Sizes = when (input) {
    Input.Pointer -> pointer
    Input.Touch -> touch
}

/**
 * The theme in effect, which the group properties (`Space`, `Radius`, `Typography`, …) read.
 * The theme composable provides it; without one, it is [DefaultTheme].
 */
val LocalTheme = staticCompositionLocalOf { DefaultTheme }

/** A drop shadow, as the token files describe it. */
data class ShadowToken(
    val color: Color,
    val offsetX: Dp,
    val offsetY: Dp,
    val blur: Dp,
    val spread: Dp,
)
