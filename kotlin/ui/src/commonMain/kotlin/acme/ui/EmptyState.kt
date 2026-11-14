package acme.ui

import acme.tokens.IconName
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign

/**
 * What a screen says when it has nothing to show, and the one thing to do about it. It is
 * centered in the space it is given, and no wider than a dialog, so its lines stay short.
 *
 * @param icon Illustrates what is missing. It is decoration: the title says it.
 * @param action Under the text, usually a [Button].
 */
@Composable
fun EmptyState(
    icon: IconName,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val colors = LocalColors.current
    Box(modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.widthIn(max = LocalSizes.current.dialog).padding(vertical = Space.s8),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(icon, size = IconSize.Xl, color = colors.emptyStateIcon)
            Spacer(Modifier.height(Space.s4))
            BasicText(title, style = Typography.heading.resolved(colors.textPrimary).copy(textAlign = TextAlign.Center))
            if (description != null) {
                Spacer(Modifier.height(Space.s2))
                BasicText(description, style = Typography.body.resolved(colors.textSecondary).copy(textAlign = TextAlign.Center))
            }
            if (action != null) {
                Spacer(Modifier.height(Space.s6))
                action()
            }
        }
    }
}
