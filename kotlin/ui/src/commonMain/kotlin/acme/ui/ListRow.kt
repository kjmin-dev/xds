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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/**
 * One line of a list: a setting, a person, a place to go.
 *
 * @param leading Drawn before the title: an avatar, an icon.
 * @param trailing Drawn at the far side: a value, a switch, a badge.
 * @param chevron Says that pressing the row goes somewhere.
 * @param onClick Makes the whole row pressable. Without it the row is static, and only what is
 *   in its slots reacts.
 * @param selected Marks the row as the current choice: the page that is open, the item whose
 *   details are shown. It is tinted, its title is heavier, and a screen reader says so.
 * @param compact For a menu or a sidebar, where many rows share little room: a lower row with
 *   smaller text.
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
    selected: Boolean = false,
    compact: Boolean = false,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val fill = when {
        // One token for both: a selected row is tinted already, and only deepens.
        selected && (pressed || hovered) -> colors.listRowBackgroundSelectedHover
        selected -> colors.listRowBackgroundSelected
        pressed -> colors.listRowBackgroundPressed
        hovered -> colors.listRowBackgroundHover
        else -> Color.Transparent
    }
    // The weight changes with the selection as well as the fill, so it does not depend on color.
    val titleStyle = when {
        compact && selected -> Typography.label
        compact -> Typography.detail
        selected -> Typography.bodyStrong
        else -> Typography.body
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            // A minimum, not a height: the row grows with a description or a larger text size.
            .heightIn(min = if (compact) sizes.listRowCompact else sizes.listRow)
            .then(if (onClick != null) Modifier.focusRing(RoundedCornerShape(0.dp)) else Modifier)
            .background(fill)
            .then(
                when {
                    // A static row is read as one item, so there is something to call selected.
                    selected && onClick == null -> Modifier.semantics(mergeDescendants = true) { this.selected = true }
                    selected -> Modifier.semantics { this.selected = true }
                    else -> Modifier
                },
            )
            .then(
                if (onClick != null) {
                    Modifier.clickable(
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
            .padding(horizontal = Space.s4, vertical = if (compact) Space.s1 else Space.s2),
        horizontalArrangement = Arrangement.spacedBy(Space.s3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        leading?.invoke()
        Column(Modifier.weight(1f)) {
            BasicText(title, style = titleStyle.resolved(if (enabled) colors.textPrimary else colors.textDisabled))
            if (description != null) {
                Text(
                    description,
                    style = if (compact) Typography.footnote else Typography.detail,
                    tone = TextTone.Secondary,
                )
            }
        }
        trailing?.invoke()
        if (chevron) Icon(IconName.ChevronRight, size = IconSize.Sm, color = colors.textTertiary, directional = true)
    }
}
