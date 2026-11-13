package acme.ui

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
import androidx.compose.ui.unit.dp

enum class BadgeTone { Neutral, Accent, Success, Warning, Danger }

/**
 * A short status or category. The words carry the meaning; the color only reinforces it. `dot`
 * adds a small mark for live states such as "connected".
 */
@Composable
fun Badge(
    label: String,
    modifier: Modifier = Modifier,
    tone: BadgeTone = BadgeTone.Neutral,
    dot: Boolean = false,
) {
    val colors = LocalColors.current
    val (background, text) = when (tone) {
        BadgeTone.Neutral -> colors.badgeNeutralBackground to colors.badgeNeutralText
        BadgeTone.Accent -> colors.badgeAccentBackground to colors.badgeAccentText
        BadgeTone.Success -> colors.badgeSuccessBackground to colors.badgeSuccessText
        BadgeTone.Warning -> colors.badgeWarningBackground to colors.badgeWarningText
        BadgeTone.Danger -> colors.badgeDangerBackground to colors.badgeDangerText
    }
    Row(
        modifier = modifier
            .defaultMinSize(minHeight = 24.dp)
            .background(background, RoundedCornerShape(Radius.full))
            .padding(horizontal = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (dot) Box(Modifier.size(6.dp).background(text, CircleShape))
        BasicText(label, style = Typography.footnote.resolved(text), maxLines = 1)
    }
}
