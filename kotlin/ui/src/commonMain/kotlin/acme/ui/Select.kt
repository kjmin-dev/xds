package acme.ui

import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/**
 * One option of a [Select].
 *
 * @param description A second line under the label, in the list.
 */
class SelectOption<T>(
    val value: T,
    val label: String,
    val description: String? = null,
)

/**
 * A field for choosing one option from a list too long to show at once. Closed, it looks like a
 * [TextField]. Pressing it opens the options the way a [Menu] opens: with a pointer a popup under
 * the field, as wide as the field; on touch a [BottomSheet] titled with `label`. The chosen
 * option has a check. Choosing one calls `onValueChange` and closes the list; a press outside,
 * Escape and Back close it without choosing.
 *
 * @param label Always visible, above the field. A screen reader names the field with it.
 * @param value The `value` of the chosen option, or null while none is chosen.
 * @param placeholder Shown in the field while nothing is chosen.
 * @param description Help shown under the field. Replaced by `error` while there is one.
 * @param error What is wrong and how to fix it. Clear it when the value changes.
 */
@Composable
fun <T> Select(
    label: String,
    options: List<SelectOption<T>>,
    value: T?,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    description: String? = null,
    error: String? = null,
    enabled: Boolean = true,
) {
    Select(label, options, value, onValueChange, modifier, placeholder, description, error, enabled, initiallyOpen = false)
}

/** @param initiallyOpen Starts with the list open, for drawing it into an image. */
@Composable
internal fun <T> Select(
    label: String,
    options: List<SelectOption<T>>,
    value: T?,
    onValueChange: (T) -> Unit,
    modifier: Modifier,
    placeholder: String?,
    description: String?,
    error: String?,
    enabled: Boolean,
    initiallyOpen: Boolean,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val density = LocalDensity.current
    var open by remember { mutableStateOf(initiallyOpen) }
    val close = { open = false }
    // The popup is as wide as the field, which it can only learn from the field's layout.
    var width by remember { mutableStateOf(0.dp) }
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val chosen = options.firstOrNull { it.value == value }
    val shown = chosen?.label ?: placeholder.orEmpty()
    val textColor = when {
        chosen == null -> colors.fieldPlaceholder
        enabled -> colors.fieldText
        else -> colors.textDisabled
    }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        // The field carries the label for a screen reader, which would otherwise hear it twice.
        FieldLabel(label, enabled, Modifier.clearAndSetSemantics {})
        // The list's popup lines up with this box, so it holds the field and nothing else.
        Box(Modifier.onSizeChanged { width = with(density) { it.width.toDp() } }) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    // A minimum, not a height: the text may grow with the system's text size.
                    .heightIn(min = sizes.controlMd)
                    // While its list is open the field looks focused: the list belongs to it.
                    .fieldBox(colors, RoundedCornerShape(Radius.md), enabled, focused || open, invalid = error != null)
                    .clickable(
                        interactionSource = interactions,
                        // No ripple or overlay: the field's look is its own.
                        indication = null,
                        enabled = enabled,
                        role = Role.DropdownList,
                        onClick = { open = true },
                    )
                    // Inside the press handling, so that what it sets replaces only what the
                    // field draws: the chosen option is said as the field's state, after its name.
                    .clearAndSetSemantics {
                        contentDescription = label
                        if (chosen != null) stateDescription = chosen.label
                        // A screen reader calls the field collapsed or expanded.
                        if (open) collapse { open = false; true } else expand { open = true; true }
                        if (error != null) error(error)
                    }
                    .padding(horizontal = Space.s3),
                horizontalArrangement = Arrangement.spacedBy(Space.s2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(
                    text = shown,
                    modifier = Modifier.weight(1f),
                    style = Typography.body.resolved(textColor),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                )
                Icon(IconName.ChevronsUpDown, size = IconSize.Sm, color = colors.fieldPlaceholder)
            }
            MenuList(
                label = label,
                open = open,
                onClose = close,
                width = width,
                // A list of options, each selected or not, rather than a menu of buttons.
                listModifier = Modifier
                    .selectableGroup()
                    .semantics { collectionInfo = CollectionInfo(rowCount = options.size, columnCount = 1) },
            ) { compact ->
                options.forEachIndexed { index, option ->
                    MenuRow(
                        label = option.label,
                        onClick = {
                            onValueChange(option.value)
                            close()
                        },
                        compact = compact,
                        modifier = Modifier.semantics {
                            collectionItemInfo = CollectionItemInfo(rowIndex = index, rowSpan = 1, columnIndex = 0, columnSpan = 1)
                        },
                        description = option.description,
                        selected = option.value == value,
                        option = true,
                    )
                }
            }
        }
        FieldHelp(error, description)
    }
}
