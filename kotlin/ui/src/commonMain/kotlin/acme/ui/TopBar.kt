package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

/**
 * The bar at the top of a screen: where the person is, and the way back. It has the page's
 * color and no line under it, so the content scrolls up to it without a seam. The caller keeps
 * it clear of the status bar.
 *
 * @param onBack Shows the back button and is called when it is pressed.
 * @param trailing Drawn at the far side: the screen's own action.
 */
@Composable
fun TopBar(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(sizes.bar)
            .background(colors.topBarBackground)
            .padding(horizontal = Space.s4),
        horizontalArrangement = Arrangement.spacedBy(Space.s3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            // The circle is the size of a small control, so it lines up with the page's edge.
            // On touch that is under `targetMin`: the area that reacts is widened around it by
            // the theme's view configuration, as for a small button.
            Box(
                modifier = Modifier
                    .size(sizes.controlSm)
                    .focusRing(CircleShape)
                    .background(colors.topBarActionBackground, CircleShape)
                    .clickable(
                        interactionSource = null,
                        indication = null,
                        role = Role.Button,
                        onClick = onBack,
                    )
                    // The mark is a drawing, so the name is all a screen reader has.
                    .semantics { contentDescription = "Back" },
                contentAlignment = Alignment.Center,
            ) {
                Icon(IconName.ChevronLeft, color = colors.topBarAction, directional = true)
            }
        }
        BasicText(
            text = title,
            modifier = Modifier.weight(1f).semantics { heading() },
            style = Typography.heading.resolved(colors.topBarText),
            overflow = TextOverflow.Ellipsis,
            maxLines = 1,
        )
        trailing?.invoke()
    }
}
