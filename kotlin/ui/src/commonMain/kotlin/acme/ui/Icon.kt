package acme.ui

import acme.tokens.IconName
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection

/** `Sm` and `Md` sit beside text; `Lg` stands alone, as in a tab bar. */
enum class IconSize { Sm, Md, Lg }

// The grid the icons in design/icons are drawn on, and the width of their stroke.
private const val Grid = 24f
private const val StrokeWidth = 2f

/**
 * An icon from design/icons.
 *
 * @param color Defaults to the color of the content around it, then to the primary text color.
 * @param label Names the icon for a screen reader. Without it the icon is decoration.
 * @param directional For arrows and chevrons: mirrors the icon in a right-to-left layout.
 */
@Composable
fun Icon(
    name: IconName,
    modifier: Modifier = Modifier,
    size: IconSize = IconSize.Md,
    color: Color = Color.Unspecified,
    label: String? = null,
    directional: Boolean = false,
) {
    val sizes = LocalSizes.current
    val side = when (size) {
        IconSize.Sm -> sizes.iconSm
        IconSize.Md -> sizes.iconMd
        IconSize.Lg -> sizes.iconLg
    }
    val tint = color.takeOrElse { LocalContentColor.current.takeOrElse { LocalColors.current.textPrimary } }
    val paths = remember(name) { name.paths.map { PathParser().parsePathString(it).toPath() } }
    val mirrored = directional && LocalLayoutDirection.current == LayoutDirection.Rtl
    Canvas(
        modifier
            .size(side)
            .then(
                if (label != null) {
                    Modifier.semantics {
                        contentDescription = label
                        role = Role.Image
                    }
                } else {
                    Modifier
                },
            ),
    ) {
        val unit = this.size.minDimension / Grid
        val stroke = Stroke(StrokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round)
        withTransform({
            // Flipped around the middle of the icon, then scaled from the grid to its size.
            if (mirrored) scale(-1f, 1f, pivot = center)
            scale(unit, unit, pivot = Offset.Zero)
        }) {
            for (path: Path in paths) drawPath(path, tint, style = stroke)
        }
    }
}
