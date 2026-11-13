package acme.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.unit.dp

/**
 * How far along something is, when that is known. When it is not, use a [Spinner].
 *
 * @param value From 0 to 1. Values outside are clamped.
 * @param label What is progressing. It is not drawn: a screen reader says it with the value.
 */
@Composable
fun ProgressBar(
    value: Float,
    label: String,
    modifier: Modifier = Modifier,
) {
    val colors = LocalColors.current
    val fraction = value.coerceIn(0f, 1f)
    Box(
        modifier
            .fillMaxWidth()
            .height(LocalSizes.current.progress)
            .clip(CircleShape)
            .background(colors.progressTrack)
            .clearAndSetSemantics {
                contentDescription = label
                progressBarRangeInfo = ProgressBarRangeInfo(fraction, 0f..1f)
            },
    ) {
        Box(Modifier.fillMaxHeight().fillMaxWidth(fraction).background(colors.progressFill, CircleShape))
    }
}
