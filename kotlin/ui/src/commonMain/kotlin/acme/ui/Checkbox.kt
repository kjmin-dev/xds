package acme.ui

import acme.tokens.Border
import acme.tokens.Radius
import acme.tokens.Space
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

/**
 * A choice that is on or off, usually one of several sent together. For a setting that takes
 * effect at once, use a [Switch].
 *
 * @param label Shown to the right. The whole row toggles, not only the box.
 */
@Composable
fun Checkbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    enabled: Boolean = true,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val shape = RoundedCornerShape(Radius.sm)
    val box = when {
        !enabled -> Modifier.background(colors.checkboxDisabledBackground, shape)
        checked -> Modifier.background(colors.checkboxBackgroundChecked, shape)
        // Unchecked has no fill, so the outline is thick enough to be seen on its own.
        else -> Modifier.border(Border.widthThick, colors.checkboxBorder, shape)
    }
    val mark = if (enabled) colors.checkboxMark else colors.checkboxDisabledMark

    Row(
        modifier = modifier
            // The box is smaller than a finger: the pressable area is never under `targetMin`.
            .defaultMinSize(minWidth = sizes.targetMin, minHeight = sizes.targetMin)
            .focusRing(shape)
            .toggleable(
                value = checked,
                interactionSource = null,
                indication = null,
                enabled = enabled,
                role = Role.Checkbox,
                onValueChange = onCheckedChange,
            ),
        horizontalArrangement = Arrangement.spacedBy(Space.s2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Canvas(Modifier.size(sizes.checkbox).then(box)) {
            if (!checked) return@Canvas
            // The mark, not the fill, says "checked": it survives a screen without color.
            val check = Path().apply {
                moveTo(size.width * 0.25f, size.height * 0.52f)
                lineTo(size.width * 0.42f, size.height * 0.69f)
                lineTo(size.width * 0.75f, size.height * 0.33f)
            }
            drawPath(check, mark, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
        if (label != null) Text(label, tone = if (enabled) TextTone.Primary else TextTone.Secondary)
    }
}
