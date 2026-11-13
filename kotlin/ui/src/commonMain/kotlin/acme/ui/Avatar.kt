package acme.ui

import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp

enum class AvatarSize { Sm, Md, Lg }

/**
 * A person, shown as their initials in a circle. A screen reader says the full name, not the
 * letters.
 */
@Composable
fun Avatar(
    name: String,
    modifier: Modifier = Modifier,
    size: AvatarSize = AvatarSize.Md,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val diameter = when (size) {
        AvatarSize.Sm -> sizes.avatarSm
        AvatarSize.Md -> sizes.avatarMd
        AvatarSize.Lg -> sizes.avatarLg
    }
    val style = when (size) {
        AvatarSize.Sm -> Typography.footnote
        AvatarSize.Md -> Typography.label
        AvatarSize.Lg -> Typography.bodyStrong
    }
    Box(
        modifier = modifier
            .size(diameter)
            .background(colors.avatarBackground, CircleShape)
            .clearAndSetSemantics { contentDescription = name },
        contentAlignment = Alignment.Center,
    ) {
        // Two letters do not fit the smallest circle.
        val letters = initials(name, max = if (size == AvatarSize.Sm) 1 else 2)
        BasicText(letters, style = style.resolved(colors.avatarText), maxLines = 1)
    }
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
