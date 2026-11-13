package acme.ui

import acme.tokens.Border
import acme.tokens.Space
import acme.tokens.Shadow
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

// The gap between the capsule's edge and the items.
private val Inset = Space.s1

/**
 * One destination in a [TabBar].
 *
 * @param icon Drawn in a 24dp square above the label. It is told whether its tab is selected,
 *   and should draw in [LocalContentColor].
 */
class TabItem<T>(
    val key: T,
    val label: String,
    val icon: @Composable (selected: Boolean) -> Unit,
)

/**
 * The bar that switches between the app's main places: a capsule that floats over the bottom of
 * the screen. The caller gives it its margins, at the sides and below it, above the bottom safe
 * area.
 */
@Composable
fun <T> TabBar(
    items: List<TabItem<T>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            // The items keep the height of a bar; the capsule adds the inset around them.
            .height(sizes.bar + Inset * 2)
            .shadow(Shadow.raised, CircleShape)
            .background(colors.tabBarBackground, CircleShape)
            .border(Border.widthThin, colors.tabBarBorder, CircleShape)
            .padding(Inset)
            .selectableGroup(),
    ) {
        for (item in items) {
            val isSelected = item.key == selected
            val color = if (isSelected) colors.tabBarTextSelected else colors.tabBarText
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .focusRing(CircleShape)
                    // The pill's shape marks the selected tab, so color is not the only signal.
                    .then(if (isSelected) Modifier.background(colors.tabBarSelectedBackground, CircleShape) else Modifier)
                    .selectable(
                        selected = isSelected,
                        interactionSource = null,
                        indication = null,
                        role = Role.Tab,
                        onClick = { onSelect(item.key) },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(sizes.iconLg), contentAlignment = Alignment.Center) {
                        CompositionLocalProvider(LocalContentColor provides color) { item.icon(isSelected) }
                    }
                    BasicText(
                        text = item.label,
                        style = Typography.footnote.resolved(color),
                        overflow = TextOverflow.Ellipsis,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}
