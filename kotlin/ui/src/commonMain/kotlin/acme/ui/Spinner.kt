package acme.ui

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class SpinnerSize { Sm, Md, Lg }

/**
 * Says that something is in progress and how long is unknown. Takes the color of the component
 * it is in. With `label` it is announced; without one it is decoration next to text that already
 * says what is happening.
 */
@Composable
fun Spinner(
    modifier: Modifier = Modifier,
    size: SpinnerSize = SpinnerSize.Md,
    label: String? = null,
) {
    val color = LocalContentColor.current.takeOrElse { LocalColors.current.textSecondary }
    val sizes = LocalSizes.current
    val diameter = when (size) {
        SpinnerSize.Sm -> sizes.spinnerSm
        SpinnerSize.Md -> sizes.spinnerMd
        SpinnerSize.Lg -> sizes.spinnerLg
    }
    SpinnerArc(
        color = color,
        diameter = diameter,
        modifier = if (label != null) modifier.semantics { contentDescription = label } else modifier,
    )
}

/** The drawing itself, for components that put a spinner in their own color, such as a button. */
@Composable
internal fun SpinnerArc(color: Color, diameter: Dp, modifier: Modifier = Modifier) {
    // People who ask for less motion get a slow pulse instead of a spin, not a frozen ring.
    val reduced = LocalReducedMotion.current
    val transition = rememberInfiniteTransition()
    val turn by transition.animateFloat(
        initialValue = 0f,
        targetValue = if (reduced) 0f else 360f,
        animationSpec = infiniteRepeatable(tween(durationMillis = 800, easing = LinearEasing)),
    )
    val pulse by transition.animateFloat(
        initialValue = 1f,
        targetValue = if (reduced) 0.4f else 1f,
        animationSpec = infiniteRepeatable(tween(durationMillis = 1000, easing = LinearEasing), RepeatMode.Reverse),
    )
    Canvas(modifier.size(diameter).graphicsLayer { alpha = pulse }) {
        // The proportions of the web spinner: a ring of radius 9 and stroke 3 in a box of 24.
        val unit = this.size.minDimension / 24f
        val ring = Size(18 * unit, 18 * unit)
        val corner = Offset(3 * unit, 3 * unit)
        // A faint full ring under the arc, so the spinner has a shape even in a still image.
        drawArc(color.copy(alpha = 0.25f), 0f, 360f, false, corner, ring, style = Stroke(3 * unit))
        drawArc(color, turn - 90f, 90f, false, corner, ring, style = Stroke(3 * unit, cap = StrokeCap.Round))
    }
}
