package acme.ui

import acme.tokens.Space
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics

/**
 * A row of [Chip]s that scrolls sideways when it does not fit, and never wraps. It holds no
 * state: which chips are selected is the app's business.
 *
 * @param label Names the group for a screen reader: what the chips filter.
 */
@Composable
fun ChipBar(
    label: String,
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    Row(
        modifier = modifier
            .semantics {
                contentDescription = label
                // Read as one group, chip after chip, before what comes after the bar.
                isTraversalGroup = true
            }
            // Compose draws no scroll bar of its own, so there is none to hide.
            .sidewaysScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(Space.s2),
        verticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}
