package acme.ui

import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

// The gap between the track's edge and the segments.
private val Inset = 2.dp

/**
 * A choice of one among a few, all visible at once: a view mode, a period. Each option is a
 * value and the label shown for it.
 *
 * @param fullWidth Stretches to the width of its container. Without it the segments are as wide
 *   as the longest label.
 */
@Composable
fun <T> SegmentedControl(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    fullWidth: Boolean = false,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    // The segments sit inside the track's corners, so their radius is smaller by the inset.
    val segment = RoundedCornerShape(Radius.md - Inset)
    Row(
        modifier = modifier
            // Every segment takes an equal share. Measured at its widest, that share is the
            // longest label's width.
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier.width(IntrinsicSize.Max))
            .height(sizes.controlMd)
            .background(colors.segmentedTrack, RoundedCornerShape(Radius.md))
            .padding(Inset)
            .selectableGroup(),
    ) {
        for ((value, label) in options) {
            val isSelected = value == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .focusRing(segment)
                    .then(
                        // Outlined as well as filled: the fill alone is too close to the track
                        // to tell which segment is chosen.
                        if (isSelected) {
                            Modifier
                                .background(colors.segmentedSelectedBackground, segment)
                                .border(1.dp, colors.segmentedSelectedBorder, segment)
                        } else {
                            Modifier
                        },
                    )
                    .selectable(
                        selected = isSelected,
                        interactionSource = null,
                        indication = null,
                        role = Role.Tab,
                        onClick = { onSelect(value) },
                    )
                    .padding(horizontal = Space.s3),
                contentAlignment = Alignment.Center,
            ) {
                BasicText(
                    text = label,
                    style = Typography.label.resolved(
                        if (isSelected) colors.segmentedSelectedText else colors.segmentedText,
                    ),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                )
            }
        }
    }
}
