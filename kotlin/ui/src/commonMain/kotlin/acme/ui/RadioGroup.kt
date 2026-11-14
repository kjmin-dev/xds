package acme.ui

import acme.tokens.Border
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics

/**
 * One option of a [RadioGroup].
 *
 * @param description A second line under the label.
 */
class RadioOption<T>(
    val value: T,
    val label: String,
    val description: String? = null,
)

/**
 * One choice among a few, sent later with the form it belongs to, like a [Checkbox]. For a
 * choice of two to four that takes effect at once, a [SegmentedControl] is the usual pick.
 *
 * @param label The group's legend, shown above the options. A screen reader names the group
 *   with it.
 * @param value The `value` of the chosen option, or null while none is chosen.
 * @param enabled False disables the whole group.
 * @param error What is wrong and how to fix it, under the options. Read out when it appears.
 */
@Composable
fun <T> RadioGroup(
    label: String,
    options: List<RadioOption<T>>,
    value: T?,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    error: String? = null,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        // The group carries the legend for a screen reader, which would otherwise hear it twice.
        FieldLabel(label, enabled, Modifier.clearAndSetSemantics {})
        Column(
            modifier = Modifier
                .semantics {
                    contentDescription = label
                    if (error != null) error(error)
                }
                .selectableGroup(),
            verticalArrangement = Arrangement.spacedBy(Space.s2),
        ) {
            for (option in options) {
                Radio(option, selected = option.value == value, enabled = enabled) { onValueChange(option.value) }
            }
        }
        FieldHelp(error, description = null)
    }
}

@Composable
private fun <T> Radio(option: RadioOption<T>, selected: Boolean, enabled: Boolean, onClick: () -> Unit) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    // One line of the label, which grows with the system's text size.
    val line = with(LocalDensity.current) { Typography.body.lineHeight.toDp() }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            // The circle is smaller than a finger: the whole row is pressable, and never lower
            // than `targetMin`.
            .defaultMinSize(minHeight = sizes.targetMin)
            .focusRing(RoundedCornerShape(Radius.sm))
            .selectable(
                selected = selected,
                interactionSource = null,
                indication = null,
                enabled = enabled,
                role = Role.RadioButton,
                onClick = onClick,
            ),
        contentAlignment = Alignment.CenterStart,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(Space.s2)) {
            // Centered on the label's first line, however many lines follow it.
            Box(Modifier.height(line), contentAlignment = Alignment.Center) {
                Canvas(Modifier.size(sizes.radio)) {
                    val radius = size.minDimension / 2
                    if (enabled) {
                        // The chosen circle's outline thickens as well as recoloring.
                        val width = (if (selected) Border.widthThick else Border.widthThin).toPx()
                        val outline = if (selected) colors.radioBorderChecked else colors.radioBorder
                        drawCircle(outline, radius = radius - width / 2, style = Stroke(width))
                    } else {
                        drawCircle(colors.radioDisabledBackground)
                    }
                    // The dot, not the color, says which one is chosen.
                    if (selected) drawCircle(if (enabled) colors.radioDot else colors.radioDisabledDot, radius = radius / 2)
                }
            }
            Column(Modifier.weight(1f)) {
                BasicText(option.label, style = Typography.body.resolved(if (enabled) colors.textPrimary else colors.textDisabled))
                if (option.description != null) {
                    BasicText(
                        option.description,
                        style = Typography.detail.resolved(if (enabled) colors.textSecondary else colors.textDisabled),
                    )
                }
            }
        }
    }
}
