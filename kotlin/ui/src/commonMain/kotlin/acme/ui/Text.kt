package acme.ui

import acme.tokens.Colors
import acme.tokens.Typography
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow

enum class TextTone {
    Primary,
    Secondary,
    Accent,
    Danger,
    Success,
    Warning,

    /** The color of the component the text is in: see [LocalContentColor]. */
    Inherit,
}

@Composable
private fun toneColor(colors: Colors, tone: TextTone): Color = when (tone) {
    TextTone.Primary -> colors.textPrimary
    TextTone.Secondary -> colors.textSecondary
    TextTone.Accent -> colors.textAccent
    TextTone.Danger -> colors.statusDanger
    TextTone.Success -> colors.statusSuccess
    TextTone.Warning -> colors.statusWarning
    TextTone.Inherit -> LocalContentColor.current.takeOrElse { colors.textPrimary }
}

/**
 * Text in one of the design system's roles. It grows with the system's text size setting.
 *
 * Korean breaks between syllables, not between words: Compose has no word-based line breaking
 * outside Android 13 and later.
 *
 * @param style What the text is for: one of the [Typography] roles. Sets size, weight, line
 *   height and tracking together.
 * @param heading Marks the text as a heading for screen readers.
 */
@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = Typography.body,
    tone: TextTone = TextTone.Primary,
    heading: Boolean = false,
    maxLines: Int = Int.MAX_VALUE,
) {
    BasicText(
        text = text,
        modifier = if (heading) modifier.semantics { heading() } else modifier,
        style = style.resolved(toneColor(LocalColors.current, tone)),
        overflow = TextOverflow.Ellipsis,
        maxLines = maxLines,
    )
}
