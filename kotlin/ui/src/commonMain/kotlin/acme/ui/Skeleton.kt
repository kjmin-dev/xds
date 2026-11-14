package acme.ui

import acme.tokens.Motion
import acme.tokens.Radius
import acme.tokens.Typography
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp

enum class SkeletonShape {
    /** One line of text. */
    Text,

    /** A block: a picture, a card. */
    Rect,

    /** An avatar. */
    Circle,
}

/**
 * Holds the place of content that is loading, in the shape of what will come. It pulses, unless
 * less motion was asked for. A screen reader does not see it: the screen that shows skeletons
 * says that it is loading.
 *
 * @param width Without it a line of text and a block fill the width of their container.
 * @param height A block needs one. A line of text is as tall as body text unless this is set.
 *   A circle is as wide as it is tall, so either length sets its size; without one it is the
 *   size of an avatar.
 */
@Composable
fun Skeleton(
    modifier: Modifier = Modifier,
    shape: SkeletonShape = SkeletonShape.Text,
    width: Dp? = null,
    height: Dp? = null,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    // The size of the letters, not of the line: stacked lines then keep the gaps the caller
    // gives them. It grows with the system's text size, as the text it stands for will.
    val line = with(LocalDensity.current) { Typography.body.fontSize.toDp() }
    val bounds = when (shape) {
        SkeletonShape.Text -> Modifier.widthOrFill(width).height(height ?: line)
        SkeletonShape.Rect -> Modifier.widthOrFill(width).height(height ?: line)
        SkeletonShape.Circle -> Modifier.size(width ?: height ?: sizes.avatarMd)
    }
    val outline = when (shape) {
        SkeletonShape.Text -> RoundedCornerShape(Radius.sm)
        SkeletonShape.Rect -> RoundedCornerShape(Radius.md)
        SkeletonShape.Circle -> CircleShape
    }
    val reduced = LocalReducedMotion.current
    // There and back is one beat, so each way takes half of it.
    val beat by rememberInfiniteTransition().animateFloat(
        initialValue = 0f,
        targetValue = if (reduced) 0f else 1f,
        animationSpec = infiniteRepeatable(tween(Motion.durationPulse / 2, easing = LinearEasing), RepeatMode.Reverse),
    )
    // A box without semantics is not in the tree a screen reader walks, so nothing hides it.
    Box(
        modifier.then(bounds).drawBehind {
            // Read while drawing, so a beat repaints the placeholder and recomposes nothing.
            val fill = lerp(colors.skeletonBackground, colors.skeletonHighlight, beat)
            drawOutline(outline.createOutline(size, layoutDirection, this), fill)
        },
    )
}

private fun Modifier.widthOrFill(width: Dp?): Modifier = if (width != null) width(width) else fillMaxWidth()
