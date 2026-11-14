package acme.ui

import acme.tokens.Border
import acme.tokens.IconName
import acme.tokens.Motion
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

/**
 * One item of an [Accordion].
 *
 * @param description A second line under the title, shown whether the item is open or not.
 * @param content The body, under the title while the item is open. [Text] in it is body text
 *   in the secondary color unless it is given a style or a tone; it may hold controls as well.
 */
class AccordionItem<T>(
    val value: T,
    val title: String,
    val description: String? = null,
    val content: @Composable () -> Unit,
)

/**
 * Items whose bodies open and close under their titles. Pressing a title opens or closes its
 * item. The accordion holds no state: the screen keeps which items are open.
 *
 * @param expanded The `value`s of the items that are open.
 * @param onExpandedChange Called with the values that are to be open after a press.
 * @param multiple Lets several items be open at once. Without it, opening one closes the others.
 */
@Composable
fun <T> Accordion(
    items: List<AccordionItem<T>>,
    expanded: Set<T>,
    onExpandedChange: (Set<T>) -> Unit,
    modifier: Modifier = Modifier,
    multiple: Boolean = false,
) {
    Column(modifier.fillMaxWidth()) {
        Hairline()
        for (item in items) {
            AccordionEntry(item, open = item.value in expanded) {
                onExpandedChange(toggled(expanded, item.value, multiple))
            }
            Hairline()
        }
    }
}

/** The values that are open after [value]'s title is pressed. */
internal fun <T> toggled(expanded: Set<T>, value: T, multiple: Boolean): Set<T> = when {
    value in expanded -> expanded - value
    multiple -> expanded + value
    else -> setOf(value)
}

@Composable
private fun Hairline() {
    Box(Modifier.fillMaxWidth().height(Border.widthThin).background(LocalColors.current.accordionBorder))
}

@Composable
private fun <T> AccordionEntry(item: AccordionItem<T>, open: Boolean, onToggle: () -> Unit) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val fill = when {
        pressed -> colors.accordionHeaderBackgroundPressed
        hovered -> colors.accordionHeaderBackgroundHover
        else -> Color.Transparent
    }
    // With less motion asked for, the body and the chevron jump to where they end up.
    val duration = if (LocalReducedMotion.current) 0 else Motion.durationNormal
    val turn by animateFloatAsState(
        targetValue = if (open) 180f else 0f,
        animationSpec = tween(duration, easing = Motion.easingStandard),
    )
    // How much of the body's height is shown: 0 is closed, 1 is open.
    val openness = remember { Animatable(if (open) 1f else 0f) }
    LaunchedEffect(open) { openness.animateTo(if (open) 1f else 0f, tween(duration, easing = Motion.easingStandard)) }
    val bodyShown by remember { derivedStateOf { openness.value > 0f } }

    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                // A minimum, not a height: the title may wrap, or grow with the text size.
                .heightIn(min = sizes.listRow)
                .focusRing(RoundedCornerShape(0.dp))
                .background(fill)
                // A screen reader hears whether the body is expanded, and can change it.
                .semantics {
                    if (open) collapse { onToggle(); true } else expand { onToggle(); true }
                }
                .clickable(
                    interactionSource = interactions,
                    // No ripple or overlay: the pressed and hover colors are tokens.
                    indication = null,
                    role = Role.Button,
                    onClick = onToggle,
                )
                .padding(horizontal = Space.s4, vertical = Space.s2),
            horizontalArrangement = Arrangement.spacedBy(Space.s3),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                BasicText(item.title, style = Typography.bodyStrong.resolved(colors.textPrimary))
                if (item.description != null) {
                    BasicText(item.description, style = Typography.detail.resolved(colors.textSecondary))
                }
            }
            // It turns as well, so open and closed do not depend on color or on the body alone.
            Icon(
                IconName.ChevronDown,
                Modifier.graphicsLayer { rotationZ = turn },
                size = IconSize.Sm,
                color = colors.accordionIcon,
            )
        }
        if (bodyShown) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clipToBounds()
                    // Laid out at its full height and shown in part, so the text does not
                    // rewrap while the body opens.
                    .layout { measurable, constraints ->
                        val placeable = measurable.measure(constraints)
                        val height = (placeable.height * openness.value).roundToInt()
                        layout(placeable.width, height) { placeable.place(0, 0) }
                    }
                    .padding(start = Space.s4, end = Space.s4, bottom = Space.s4),
            ) {
                // The body's look, for what in it does not set its own: plain text reads as the
                // body of the item, and controls keep their colors.
                CompositionLocalProvider(
                    LocalTextStyle provides Typography.body,
                    LocalContentColor provides colors.textSecondary,
                    content = item.content,
                )
            }
        }
    }
}
