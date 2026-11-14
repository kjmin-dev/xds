package acme.ui

import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter

/** The shape of a [Thumbnail]: its width to its height. */
enum class ThumbnailRatio(internal val value: Float) {
    /** 16:9, a video. */
    Ratio16x9(16f / 9f),

    /** 1:1, a product or an album. */
    Ratio1x1(1f),

    /** 4:3, a photo. */
    Ratio4x3(4f / 3f),

    /** 9:16, a short vertical video. */
    Ratio9x16(9f / 16f),
}

/**
 * A picture in a fixed shape, for a video, an article or a product. It fills the width it is
 * given and takes its height from `ratio`. While the picture loads, when it cannot be loaded and
 * when there is none, a picture mark holds its place.
 *
 * @param src The URL of the picture. It fills the shape, cropped to cover it.
 * @param alt What the picture shows, for a screen reader. An empty one makes the picture
 *   decoration.
 * @param badge Short text on the bottom end corner, such as a duration.
 * @param progress From 0 to 1: how much of it was watched, as a bar across the bottom edge.
 *   Null and 0 draw no bar.
 */
@Composable
fun Thumbnail(
    src: String?,
    alt: String,
    modifier: Modifier = Modifier,
    ratio: ThumbnailRatio = ThumbnailRatio.Ratio16x9,
    badge: String? = null,
    progress: Float? = null,
) {
    val colors = LocalColors.current
    // Remembered per picture, so a new `src` starts from the mark again.
    var loaded by remember(src) { mutableStateOf(false) }
    val watched = progress?.coerceIn(0f, 1f)?.takeIf { it > 0f }
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(ratio.value)
            .clip(RoundedCornerShape(Radius.md))
            .background(colors.thumbnailBackground)
            .then(
                if (alt.isNotEmpty()) {
                    // One image to a screen reader, its badge read with it.
                    Modifier.semantics(mergeDescendants = true) {
                        contentDescription = alt
                        role = Role.Image
                    }
                } else {
                    Modifier
                },
            ),
    ) {
        // Taken away once the picture is there: one with transparent parts would show it.
        if (!loaded) Icon(IconName.Image, Modifier.align(Alignment.Center), size = IconSize.Lg, color = colors.thumbnailIcon)
        if (src != null) {
            // Draws nothing until the picture has loaded, and nothing if it fails.
            AsyncImage(
                model = src,
                contentDescription = null,
                modifier = Modifier.matchParentSize(),
                contentScale = ContentScale.Crop,
                onState = { loaded = it is AsyncImagePainter.State.Success },
            )
        }
        if (badge != null) {
            Badge(
                label = badge,
                // Above the bar when there is one, so the bar is whole.
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = Space.s2, bottom = Space.s2 + if (watched != null) Space.s1 else 0.dp),
                tone = BadgeTone.Overlay,
            )
        }
        if (watched != null) {
            // The clip rounds its ends into the thumbnail's corners.
            Box(
                Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .height(Space.s1)
                    .background(colors.overlayBackground),
            ) {
                Box(Modifier.fillMaxHeight().fillMaxWidth(watched).background(colors.overlayAccent))
            }
        }
    }
}
