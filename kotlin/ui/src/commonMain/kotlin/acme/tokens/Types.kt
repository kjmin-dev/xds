// The hand-written half of the tokens: the types and helpers the generated Tokens.kt refers to.

package acme.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

/** A color mode. Each one has a full set of color tokens. */
enum class Mode { Light, Dark }

/** The color tokens for a mode. */
fun colors(mode: Mode): Colors = when (mode) {
    Mode.Light -> LightColors
    Mode.Dark -> DarkColors
}

/** A drop shadow, as the token files describe it. */
data class ShadowToken(
    val color: Color,
    val offsetX: Dp,
    val offsetY: Dp,
    val blur: Dp,
    val spread: Dp,
)
