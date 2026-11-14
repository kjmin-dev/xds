package acme.ui

import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow

/** How a [MediaCard] places its thumbnail and its text. */
enum class MediaCardLayout {
    /** The thumbnail on top and the text under it, as in a feed. */
    Vertical,

    /** The thumbnail at the start, 40% of the card's width, and the text beside it, as in a list. */
    Horizontal,
}

/**
 * A thumbnail with its title and details: a video in a feed, an article in a list. `src`, `alt`,
 * `ratio`, `badge` and `progress` are the [Thumbnail]'s.
 *
 * @param meta Short lines under the title, such as a channel's name and when it was posted. Each
 *   takes one line.
 * @param leading Before the text in the vertical layout, such as an [Avatar]. The horizontal
 *   layout leaves it out.
 * @param action At the end of the text: an [IconButton], or a [Menu] that one opens. It stays a
 *   control of its own: pressing it does not press the card.
 * @param onClick Makes the whole card one button, named by its title and its meta lines. It has
 *   no surface at rest, and a fill under a pointer and while pressed.
 */
@Composable
fun MediaCard(
    title: String,
    modifier: Modifier = Modifier,
    layout: MediaCardLayout = MediaCardLayout.Vertical,
    src: String? = null,
    alt: String = "",
    ratio: ThumbnailRatio = ThumbnailRatio.Ratio16x9,
    badge: String? = null,
    progress: Float? = null,
    meta: List<String> = emptyList(),
    leading: (@Composable () -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
    onClick: (() -> Unit)? = null,
) {
    val colors = LocalColors.current
    val shape = RoundedCornerShape(Radius.lg)
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val fill = when {
        pressed -> colors.cardBackgroundPressed
        hovered -> colors.cardBackgroundHover
        else -> Color.Transparent
    }
    // A button's name is its title and its meta lines, so what else the card draws is part of
    // the button rather than read on its own. The action stays outside this.
    val inButton = if (onClick != null) Modifier.clearAndSetSemantics {} else Modifier
    val frame = if (onClick != null) {
        Modifier
            .focusRing(shape)
            .background(fill, shape)
            .clickable(
                interactionSource = interactions,
                // No ripple or overlay: the pressed and hover colors are tokens.
                indication = null,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { contentDescription = (listOf(title) + meta).joinToString(", ") }
            // Room for the fill around everything, so the fill does not touch the picture.
            .padding(Space.s2)
    } else {
        Modifier
    }

    when (layout) {
        MediaCardLayout.Vertical -> Column(
            modifier = modifier.fillMaxWidth().then(frame),
            verticalArrangement = Arrangement.spacedBy(Space.s3),
        ) {
            Thumbnail(src, alt, inButton, ratio, badge, progress)
            Row(horizontalArrangement = Arrangement.spacedBy(Space.s3)) {
                if (leading != null) Box(inButton) { leading() }
                MediaText(title, meta, Modifier.weight(1f).then(inButton))
                action?.invoke()
            }
        }
        MediaCardLayout.Horizontal -> Row(
            modifier = modifier.fillMaxWidth().then(frame),
            horizontalArrangement = Arrangement.spacedBy(Space.s3),
        ) {
            Thumbnail(src, alt, inButton.fillMaxWidth(0.4f), ratio, badge, progress)
            MediaText(title, meta, Modifier.weight(1f).then(inButton))
            action?.invoke()
        }
    }
}

@Composable
private fun MediaText(title: String, meta: List<String>, modifier: Modifier) {
    val colors = LocalColors.current
    Column(modifier) {
        BasicText(
            text = title,
            style = Typography.bodyStrong.resolved(colors.textPrimary),
            overflow = TextOverflow.Ellipsis,
            maxLines = 2,
        )
        for (line in meta) {
            BasicText(
                text = line,
                style = Typography.detail.resolved(colors.textSecondary),
                overflow = TextOverflow.Ellipsis,
                maxLines = 1,
            )
        }
    }
}
