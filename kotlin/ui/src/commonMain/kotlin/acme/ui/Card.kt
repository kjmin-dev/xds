package acme.ui

import acme.tokens.Border
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

/**
 * A surface that groups related content. The outline sets it apart, with a faint shadow under
 * it: the shadow alone barely shows in dark mode. `title` is a heading; `actions` sit across
 * from it.
 *
 * @param flush For a card that holds a list: no padding and no gap, so rows and dividers run
 *   from edge to edge, cut to the card's corners.
 */
@Composable
fun Card(
    modifier: Modifier = Modifier,
    title: String? = null,
    description: String? = null,
    actions: (@Composable () -> Unit)? = null,
    flush: Boolean = false,
    content: @Composable ColumnScope.() -> Unit = {},
) {
    val colors = LocalColors.current
    val shape = RoundedCornerShape(Radius.lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .shadow(Shadow.subtle, shape)
            .background(colors.backgroundSurface, shape)
            // Drawn over the content, so a row's hover fill does not cover the outline.
            .border(Border.widthThin, colors.borderDefault, shape)
            .then(if (flush) Modifier.clip(shape) else Modifier.padding(Space.s4)),
        verticalArrangement = if (flush) Arrangement.Top else Arrangement.spacedBy(Space.s4),
    ) {
        if (title != null || actions != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(Space.s3)) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    if (title != null) Text(title, style = Typography.heading, heading = true)
                    if (description != null) Text(description, style = Typography.detail, tone = TextTone.Secondary)
                }
                actions?.invoke()
            }
        }
        content()
    }
}

/** A line between groups of content. */
@Composable
fun Divider(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().height(Border.widthThin).background(LocalColors.current.borderDefault))
}
