package acme.ui

import acme.tokens.Sizes
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import coil3.compose.AsyncImage
import coil3.compose.AsyncImagePainter

/** `Xl` is for a profile header. */
enum class AvatarSize { Sm, Md, Lg, Xl }

/**
 * A person, shown as their picture in a circle, or as their initials when there is none. A
 * screen reader says the full name, not the letters, and never the picture.
 *
 * @param src The URL of the picture. It fills the circle, cropped to cover it. The initials show
 *   while it loads and when it cannot be loaded.
 */
@Composable
fun Avatar(
    name: String,
    modifier: Modifier = Modifier,
    size: AvatarSize = AvatarSize.Md,
    src: String? = null,
) {
    AvatarCircle(name, src, size, modifier.clearAndSetSemantics { contentDescription = name })
}

/** The drawing itself, without a name for the screen reader: a stack names its avatars as one. */
@Composable
internal fun AvatarCircle(name: String, src: String?, size: AvatarSize, modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    // Remembered per picture, so a new `src` starts from the initials again.
    var loaded by remember(src) { mutableStateOf(false) }
    Box(
        modifier = modifier
            .size(avatarDiameter(LocalSizes.current, size))
            .background(colors.avatarBackground, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        // Taken away once the picture is there: one with transparent parts would show them.
        if (!loaded) {
            // Two letters do not fit the smallest circle.
            val letters = initials(name, max = if (size == AvatarSize.Sm) 1 else 2)
            BasicText(letters, style = avatarTextStyle(size).resolved(colors.avatarText), maxLines = 1)
        }
        if (src != null) {
            // Draws nothing until the picture has loaded, and nothing if it fails.
            AsyncImage(
                model = src,
                contentDescription = null,
                modifier = Modifier.matchParentSize().clip(CircleShape),
                contentScale = ContentScale.Crop,
                onState = { loaded = it is AsyncImagePainter.State.Success },
            )
        }
    }
}

internal fun avatarDiameter(sizes: Sizes, size: AvatarSize): Dp = when (size) {
    AvatarSize.Sm -> sizes.avatarSm
    AvatarSize.Md -> sizes.avatarMd
    AvatarSize.Lg -> sizes.avatarLg
    AvatarSize.Xl -> sizes.avatarXl
}

/** The type role of the initials, and of anything else written in a circle of that size. */
internal fun avatarTextStyle(size: AvatarSize): TextStyle = when (size) {
    AvatarSize.Sm -> Typography.footnote
    AvatarSize.Md -> Typography.label
    AvatarSize.Lg -> Typography.bodyStrong
    AvatarSize.Xl -> Typography.title
}

/**
 * The first letter of each of the first [max] words of [name], uppercased. A letter outside the
 * basic plane is kept whole.
 */
fun initials(name: String, max: Int = 2): String =
    name.split(Regex("\\s+"))
        .filter { it.isNotEmpty() }
        .take(max)
        .joinToString("") { word ->
            val whole = word[0].isHighSurrogate() && word.length > 1 && word[1].isLowSurrogate()
            word.substring(0, if (whole) 2 else 1).uppercase()
        }
