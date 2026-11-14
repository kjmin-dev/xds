package acme.ui

import acme.tokens.Border
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics

/**
 * A surface that groups related content. The outline sets it apart, with a faint shadow under
 * it: the shadow alone barely shows in dark mode. `title` is a heading; `actions` sit across
 * from it.
 *
 * @param flush For a card that holds a list: no padding and no gap, so rows and dividers run
 *   from edge to edge, cut to the card's corners.
 * @param media Drawn at the top from edge to edge, above the padding, cut to the card's top
 *   corners: a picture, a map.
 * @param onClick Makes the whole card one button. Put no other control inside it; `actions` are
 *   left out.
 * @param selected Marks the card as the current choice with a thick outline in place of the
 *   thin one. A pressable card tells a screen reader as well.
 */
@Composable
fun Card(
    modifier: Modifier = Modifier,
    title: String? = null,
    description: String? = null,
    actions: (@Composable () -> Unit)? = null,
    flush: Boolean = false,
    media: (@Composable () -> Unit)? = null,
    onClick: (() -> Unit)? = null,
    selected: Boolean = false,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    val colors = LocalColors.current
    val shape = RoundedCornerShape(Radius.lg)
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val fill = when {
        pressed -> colors.cardBackgroundPressed
        hovered -> colors.cardBackgroundHover
        else -> colors.backgroundSurface
    }
    // A button inside a button cannot be reached, so a pressable card has no actions.
    val shownActions = if (onClick == null) actions else null

    Column(
        modifier = modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.focusRing(shape) else Modifier)
            .shadow(Shadow.subtle, shape)
            .background(fill, shape)
            // Drawn over the content, so a row's hover fill does not cover the outline. It is
            // also drawn inside the card's bounds, so the thick one of a selected card takes no
            // room: the selection shows in the form, not in the color alone, and nothing moves.
            .border(
                width = if (selected) Border.widthThick else Border.widthThin,
                color = if (selected) colors.cardBorderSelected else colors.borderDefault,
                shape = shape,
            )
            .then(
                if (onClick != null) {
                    Modifier
                        .semantics { if (selected) this.selected = true }
                        .clickable(
                            interactionSource = interactions,
                            // No ripple or overlay: the pressed and hover colors are tokens.
                            indication = null,
                            role = Role.Button,
                            onClick = onClick,
                        )
                } else {
                    Modifier
                },
            )
            .then(if (flush) Modifier.clip(shape) else Modifier),
    ) {
        if (media != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    // A flush card is cut to its corners as a whole already.
                    .then(if (flush) Modifier else Modifier.clip(RoundedCornerShape(topStart = Radius.lg, topEnd = Radius.lg))),
            ) {
                media()
            }
        }
        Column(
            modifier = if (flush) Modifier else Modifier.padding(Space.s4),
            verticalArrangement = if (flush) Arrangement.Top else Arrangement.spacedBy(Space.s4),
        ) {
            if (title != null || shownActions != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(Space.s3)) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Space.s0_5)) {
                        if (title != null) Text(title, style = Typography.heading, tone = TextTone.Primary, heading = true)
                        if (description != null) Text(description, style = Typography.detail, tone = TextTone.Secondary)
                    }
                    shownActions?.invoke()
                }
            }
            content()
        }
    }
}

/** A line between groups of content. */
@Composable
fun Divider(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().height(Border.widthThin).background(LocalColors.current.borderDefault))
}
