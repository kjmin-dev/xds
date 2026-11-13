package acme.ui

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/**
 * A drawn "<" or ">", so that no icon font or image is needed. It fills the size the modifier
 * gives it.
 */
@Composable
internal fun Chevron(color: Color, pointsForward: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = 2.dp.toPx()
        // Kept inside the bounds by half the stroke, so the round caps are not cut off.
        val near = stroke / 2
        val far = size.width - stroke / 2
        val (tip, tail) = if (pointsForward) far to near else near to far
        val path = Path().apply {
            moveTo(tail, near)
            lineTo(tip, size.height / 2)
            lineTo(tail, size.height - near)
        }
        drawPath(path, color, style = Stroke(stroke, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
}
