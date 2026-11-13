package acme.ui

import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.coerceAtLeast
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max

enum class BannerTone { Info, Success, Warning, Danger }

/** What a [Banner] offers to do about its message: the button's label and what it does. */
class BannerAction(val label: String, val onClick: () -> Unit)

/**
 * A message about the whole screen or a section of it. Problems (`Warning`, `Danger`) are
 * announced by the screen reader as soon as they appear.
 *
 * @param action Drawn as a button under the message.
 * @param onDismiss Shows a close button and is called when it is pressed. The banner does not
 *   hide itself: stop composing it.
 * @param dismissLabel Names the close button for a screen reader.
 */
@Composable
fun Banner(
    message: String,
    modifier: Modifier = Modifier,
    tone: BannerTone = BannerTone.Info,
    title: String? = null,
    action: BannerAction? = null,
    onDismiss: (() -> Unit)? = null,
    dismissLabel: String = "Dismiss",
) {
    val colors = LocalColors.current
    val (background, accent) = when (tone) {
        BannerTone.Info -> colors.bannerInfoBackground to colors.bannerInfoAccent
        BannerTone.Success -> colors.bannerSuccessBackground to colors.bannerSuccessAccent
        BannerTone.Warning -> colors.bannerWarningBackground to colors.bannerWarningAccent
        BannerTone.Danger -> colors.bannerDangerBackground to colors.bannerDangerAccent
    }
    val urgent = tone == BannerTone.Danger || tone == BannerTone.Warning
    Row(
        modifier = modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) {
                liveRegion = if (urgent) LiveRegionMode.Assertive else LiveRegionMode.Polite
            }
            .background(background, RoundedCornerShape(Radius.md))
            .padding(Space.s3),
        horizontalArrangement = Arrangement.spacedBy(Space.s3),
    ) {
        Canvas(Modifier.size(LocalSizes.current.iconMd)) {
            drawCircle(accent)
            mark(tone, background)
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Space.s0_5)) {
            if (title != null) BasicText(title, style = Typography.label.resolved(colors.bannerText))
            BasicText(message, style = Typography.detail.resolved(colors.bannerText))
            if (action != null) {
                Button(
                    label = action.label,
                    onClick = action.onClick,
                    // Set apart from the message, which the lines of text are not from each other.
                    modifier = Modifier.padding(top = Space.s2),
                    variant = ButtonVariant.Secondary,
                    size = ControlSize.Sm,
                )
            }
        }
        if (onDismiss != null) {
            val sizes = LocalSizes.current
            // The control is as large as the minimum target, which on touch is more than the
            // banner's padding leaves room for. So it reaches into the padding, at the top, the
            // bottom and the end, until its cross is level with the mark at the start or it
            // meets the banner's edge. A one-line banner then stays as low as it was.
            val control = max(sizes.controlSm, sizes.targetMin)
            val margin = (Space.s3 + sizes.iconMd / 2 - control / 2).coerceAtLeast(0.dp)
            val reach = Space.s3 - margin
            IconOnlyButton(
                icon = IconName.X,
                label = dismissLabel,
                onClick = onDismiss,
                modifier = Modifier.layout { measurable, constraints ->
                    val button = measurable.measure(constraints)
                    val by = reach.roundToPx()
                    layout(button.width - by, (button.height - 2 * by).coerceAtLeast(0)) {
                        button.placeRelative(0, -by)
                    }
                },
            )
        }
    }
}

/**
 * Each tone has its own mark, so the tone does not depend on color: i, a check, ! and a cross.
 * They are drawn rather than typed, so they do not depend on what glyphs the system font has.
 */
private fun DrawScope.mark(tone: BannerTone, color: Color) {
    // Coordinates are on the 20-unit grid of the circle.
    val unit = size.minDimension / 20f
    fun point(x: Float, y: Float) = Offset(x * unit, y * unit)
    fun line(from: Offset, to: Offset) = drawLine(color, from, to, strokeWidth = 2 * unit, cap = StrokeCap.Round)
    when (tone) {
        BannerTone.Info -> {
            drawCircle(color, radius = 1.25f * unit, center = point(10f, 6f))
            line(point(10f, 9.5f), point(10f, 14.5f))
        }
        BannerTone.Success -> {
            val check = Path().apply {
                moveTo(5.75f * unit, 10.5f * unit)
                lineTo(8.75f * unit, 13.5f * unit)
                lineTo(14.25f * unit, 7f * unit)
            }
            drawPath(check, color, style = Stroke(2 * unit, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
        BannerTone.Warning -> {
            line(point(10f, 5.5f), point(10f, 10.5f))
            drawCircle(color, radius = 1.25f * unit, center = point(10f, 14f))
        }
        BannerTone.Danger -> {
            line(point(6.75f, 6.75f), point(13.25f, 13.25f))
            line(point(13.25f, 6.75f), point(6.75f, 13.25f))
        }
    }
}
