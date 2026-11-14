package acme.ui

import acme.tokens.Border
import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow

/**
 * One tab of [Tabs].
 *
 * @param icon Drawn before the label, in the label's color.
 */
class TabsItem<T>(
    val value: T,
    val label: String,
    val icon: IconName? = null,
)

/**
 * Switches between views inside one screen. It is only the row: the app shows the view that
 * matches `value`. For two to four short modes a [SegmentedControl] is lighter; this is for more
 * items, longer labels, or a row that may have to scroll, which it does sideways when the tabs
 * do not fit.
 *
 * @param value The `value` of the selected tab.
 * @param label Names the row of tabs for a screen reader.
 * @param fullWidth The tabs share the width of the container equally, and the row does not
 *   scroll.
 */
@Composable
fun <T> Tabs(
    items: List<TabsItem<T>>,
    value: T,
    onValueChange: (T) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    fullWidth: Boolean = false,
) {
    val colors = LocalColors.current
    val hairline = colors.tabsBorder
    Row(
        modifier = modifier
            .fillMaxWidth()
            // The hairline runs the whole width, not only under the tabs, and does not scroll
            // with them. It is drawn inside the row's height, so the selected tab's bar, drawn
            // after it, lies over it.
            .drawBehind {
                val thickness = Border.widthThin.toPx()
                drawRect(hairline, Offset(0f, size.height - thickness), Size(size.width, thickness))
            }
            .semantics { contentDescription = label }
            // Compose draws no scroll bar of its own, so there is none to hide.
            .then(if (fullWidth) Modifier else Modifier.sidewaysScroll(rememberScrollState()))
            .selectableGroup(),
    ) {
        for (item in items) {
            Tab(
                item = item,
                selected = item.value == value,
                onClick = { onValueChange(item.value) },
                modifier = if (fullWidth) Modifier.weight(1f) else Modifier,
            )
        }
    }
}

@Composable
private fun <T> RowScope.Tab(item: TabsItem<T>, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val color = when {
        selected -> colors.tabsTextSelected
        hovered -> colors.tabsTextHover
        else -> colors.tabsText
    }
    val indicator = colors.tabsIndicator
    Row(
        modifier = modifier
            .height(sizes.tab)
            .focusRing(RoundedCornerShape(Radius.sm))
            // The bar's shape marks the selected tab, so color is not the only signal.
            .drawBehind {
                if (!selected) return@drawBehind
                val thickness = Border.widthThick.toPx()
                drawRect(indicator, Offset(0f, size.height - thickness), Size(size.width, thickness))
            }
            .selectable(
                selected = selected,
                interactionSource = interactions,
                indication = null,
                role = Role.Tab,
                onClick = onClick,
            )
            .padding(horizontal = Space.s4),
        horizontalArrangement = Arrangement.spacedBy(Space.s2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (item.icon != null) Icon(item.icon, size = IconSize.Sm, color = color)
        BasicText(
            text = item.label,
            style = Typography.label.resolved(color),
            overflow = TextOverflow.Ellipsis,
            maxLines = 1,
        )
    }
}
