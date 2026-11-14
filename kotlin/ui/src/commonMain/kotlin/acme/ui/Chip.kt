package acme.ui

import acme.tokens.Border
import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow

/**
 * A choice that filters what is shown: a category, a status. Unlike a [Badge] it is pressed.
 * Several usually sit in a [ChipBar].
 *
 * @param onClick Called when the chip is pressed. The chip does not flip `selected` itself.
 * @param selected Tints and outlines the chip and puts a check before its label, in the place
 *   of `iconStart`, so the state does not depend on color. A screen reader says it as well.
 * @param iconStart Drawn before the label, in the label's color.
 */
@Composable
fun Chip(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    iconStart: IconName? = null,
    enabled: Boolean = true,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    // Disabled is recolored, not faded, and wins over selected, as on a button.
    val fill = when {
        !enabled -> colors.chipDisabledBackground
        selected && pressed -> colors.chipSelectedBackgroundPressed
        selected && hovered -> colors.chipSelectedBackgroundHover
        selected -> colors.chipSelectedBackground
        pressed -> colors.chipBackgroundPressed
        hovered -> colors.chipBackgroundHover
        else -> colors.chipBackground
    }
    val text = when {
        !enabled -> colors.chipDisabledText
        selected -> colors.chipSelectedText
        else -> colors.chipText
    }
    val shape = RoundedCornerShape(Radius.full)
    val icon = if (selected) IconName.Check else iconStart

    Row(
        modifier = modifier
            // A minimum, not a height: the label may grow with the system's text size. Where the
            // chip is lower than the minimum target, a touch anywhere in the target around it
            // still reaches it, which the theme's view configuration takes care of.
            .defaultMinSize(minHeight = sizes.chip)
            .focusRing(shape)
            .background(fill, shape)
            // Drawn inside the chip's bounds, so selecting a chip does not move its neighbours.
            .then(
                if (selected && enabled) {
                    Modifier.border(Border.widthThin, colors.chipSelectedBorder, shape)
                } else {
                    Modifier
                },
            )
            .toggleable(
                value = selected,
                interactionSource = interactions,
                // No ripple or overlay: the pressed and hover colors are tokens.
                indication = null,
                enabled = enabled,
                role = Role.Button,
                // The caller owns the value, so a press only asks for the change.
                onValueChange = { onClick() },
            )
            .padding(horizontal = Space.s3),
        horizontalArrangement = Arrangement.spacedBy(Space.s1_5),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) Icon(icon, size = IconSize.Sm, color = text)
        BasicText(
            text = label,
            style = Typography.label.resolved(text),
            overflow = TextOverflow.Ellipsis,
            maxLines = 1,
        )
    }
}
