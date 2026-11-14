package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/** What a [SectionHeader] offers to do, such as "See all": the button's label and what it does. */
class SectionHeaderAction(val label: String, val onClick: () -> Unit)

/**
 * The title row of a group of content: an optional icon, the title with an optional description
 * under it, and an optional action at the end edge.
 *
 * @param icon Drawn before the title.
 * @param action A small ghost button at the end edge, with a chevron that points onward.
 * @param level The title's level in the outline of the page. Compose's semantics have no heading
 *   levels, so a screen reader is told only that the title is a heading; the option is here so
 *   that a header takes the same options on every platform.
 */
@Suppress("UNUSED_PARAMETER")
@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: IconName? = null,
    action: SectionHeaderAction? = null,
    level: Int = 2,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    Column(modifier.fillMaxWidth()) {
        // The action is centered on the title's line, not on the title and the description.
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(icon, size = IconSize.Md, color = colors.textSecondary)
                Spacer(Modifier.width(Space.s2))
            }
            Text(title, Modifier.weight(1f), Typography.heading, TextTone.Primary, heading = true)
            if (action != null) {
                Spacer(Modifier.width(Space.s4))
                ButtonFrame(
                    onClick = action.onClick,
                    modifier = Modifier,
                    variant = ButtonVariant.Ghost,
                    size = ControlSize.Sm,
                    enabled = true,
                    loading = false,
                    fullWidth = false,
                    selected = null,
                    name = null,
                ) { text, _ ->
                    BasicText(
                        text = action.label,
                        modifier = Modifier.weight(1f, fill = false),
                        style = Typography.label.resolved(text),
                        overflow = TextOverflow.Ellipsis,
                        maxLines = 1,
                    )
                    // Points onward, which is to the left in a right-to-left layout.
                    Icon(IconName.ChevronRight, size = IconSize.Sm, color = text, directional = true)
                }
            }
        }
        if (description != null) {
            Text(
                description,
                // Under the title, not under the icon.
                modifier = Modifier.padding(start = if (icon != null) sizes.iconMd + Space.s2 else 0.dp),
                style = Typography.detail,
                tone = TextTone.Secondary,
            )
        }
    }
}
