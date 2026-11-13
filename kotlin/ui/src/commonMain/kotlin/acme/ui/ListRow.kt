package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

/**
 * One line of a list: a setting, a person, a place to go.
 *
 * @param leading Drawn before the title: an avatar, an icon.
 * @param trailing Drawn at the far side: a value, a switch, a badge.
 * @param chevron Says that pressing the row goes somewhere.
 * @param onClick Makes the whole row pressable. Without it the row is static, and only what is
 *   in its slots reacts.
 */
@Composable
fun ListRow(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    chevron: Boolean = false,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val fill = when {
        pressed -> colors.listRowBackgroundPressed
        hovered -> colors.listRowBackgroundHover
        else -> Color.Transparent
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            // A minimum, not a height: the row grows with a description or a larger text size.
            .heightIn(min = sizes.listRow)
            .then(
                if (onClick != null) {
                    Modifier
                        .focusRing(RoundedCornerShape(0.dp))
                        .background(fill)
                        .clickable(
                            interactionSource = interactions,
                            indication = null,
                            enabled = enabled,
                            role = Role.Button,
                            onClick = onClick,
                        )
                } else {
                    Modifier
                },
            )
            .padding(horizontal = Space.s4, vertical = Space.s2),
        horizontalArrangement = Arrangement.spacedBy(Space.s3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.invoke()
        Column(Modifier.weight(1f)) {
            BasicText(title, style = Typography.body.resolved(if (enabled) colors.textPrimary else colors.textDisabled))
            if (description != null) Text(description, style = Typography.detail, tone = TextTone.Secondary)
        }
        trailing?.invoke()
        if (chevron) Icon(IconName.ChevronRight, size = IconSize.Sm, color = colors.textTertiary, directional = true)
    }
}
