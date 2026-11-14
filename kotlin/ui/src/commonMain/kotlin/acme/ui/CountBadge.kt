package acme.ui

import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Constraints

/**
 * How many of something are waiting: unread messages, items in a cart. Nothing is drawn for a
 * count of zero or less.
 *
 * @param max The largest number written out. A larger count shows as this number and a plus.
 * @param label What a screen reader says, such as "3 unread notifications". Without it the
 *   screen reader reads the number, which says nothing about what is counted.
 * @param content The thing the count is about: an icon, an avatar, a button. The badge sits on
 *   its top end corner. Without it the badge is laid out like any other element.
 */
@Composable
fun CountBadge(
    count: Int,
    modifier: Modifier = Modifier,
    max: Int = 99,
    label: String? = null,
    content: (@Composable () -> Unit)? = null,
) {
    if (content == null) {
        if (count > 0) CountPill(count, max, label, modifier)
        return
    }
    Layout(
        content = {
            // One box, so the content is one thing to measure whatever it is made of.
            Box { content() }
            if (count > 0) CountPill(count, max, label)
        },
        modifier = modifier,
    ) { measurables, constraints ->
        val child = measurables[0].measure(constraints)
        val pill = measurables.getOrNull(1)?.measure(Constraints())
        // The size of the content alone: the badge hangs over the corner without moving what
        // is around it.
        layout(child.width, child.height) {
            child.placeRelative(0, 0)
            if (pill != null) {
                // Out from the corner by a quarter of its height, so it overlaps the corner
                // rather than covering the content. Placed relative, so it follows the layout
                // direction to the top left in a right-to-left layout.
                val out = pill.height / 4
                pill.placeRelative(child.width - pill.width + out, -out)
            }
        }
    }
}

@Composable
private fun CountPill(count: Int, max: Int, label: String?, modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    val side = LocalSizes.current.countBadge
    Box(
        modifier = modifier
            // A circle for one digit, a pill for more. A minimum, so it grows with the text size.
            .defaultMinSize(minWidth = side, minHeight = side)
            .background(colors.badgeCountBackground, RoundedCornerShape(Radius.full))
            .then(if (label != null) Modifier.clearAndSetSemantics { contentDescription = label } else Modifier)
            .padding(horizontal = Space.s1),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text = countText(count, max),
            style = Typography.footnote.resolved(colors.badgeCountText),
            softWrap = false,
            maxLines = 1,
        )
    }
}

/** What the badge shows: the count, or `max` and a plus when the count is larger. */
internal fun countText(count: Int, max: Int): String = if (count > max) "$max+" else count.toString()
