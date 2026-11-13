package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Radius
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

enum class BadgeTone {
    Neutral,
    Accent,
    Success,
    Warning,
    Danger,

    /** For a badge that sits on a picture, such as a duration on a thumbnail. */
    Overlay,
}

/**
 * A short status or category. The words carry the meaning; the color only reinforces it. `dot`
 * adds a small mark for live states such as "connected".
 *
 * @param icon Drawn before the label, after the dot, in the label's color.
 */
@Composable
fun Badge(
    label: String,
    modifier: Modifier = Modifier,
    tone: BadgeTone = BadgeTone.Neutral,
    dot: Boolean = false,
    icon: IconName? = null,
) {
    val colors = LocalColors.current
    val (background, text) = when (tone) {
        BadgeTone.Neutral -> colors.badgeNeutralBackground to colors.badgeNeutralText
        BadgeTone.Accent -> colors.badgeAccentBackground to colors.badgeAccentText
        BadgeTone.Success -> colors.badgeSuccessBackground to colors.badgeSuccessText
        BadgeTone.Warning -> colors.badgeWarningBackground to colors.badgeWarningText
        BadgeTone.Danger -> colors.badgeDangerBackground to colors.badgeDangerText
        BadgeTone.Overlay -> colors.badgeOverlayBackground to colors.badgeOverlayText
    }
    Row(
        modifier = modifier
            .defaultMinSize(minHeight = LocalSizes.current.badge)
            .background(background, RoundedCornerShape(Radius.full))
            .padding(horizontal = Space.s2_5),
        horizontalArrangement = Arrangement.spacedBy(Space.s1_5),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (dot) Box(Modifier.size(Space.s1_5).background(text, CircleShape))
        if (icon != null) Icon(icon, size = IconSize.Xs, color = text)
        BasicText(label, style = Typography.footnote.resolved(text), maxLines = 1)
    }
}
