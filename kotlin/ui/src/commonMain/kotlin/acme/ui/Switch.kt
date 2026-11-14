package acme.ui

import acme.tokens.Motion
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

// The gap between the thumb and the edge of the track.
private val Inset = Space.s0_5

/**
 * A setting that is on or off and takes effect at once. For a choice that is sent with a form,
 * use a [Checkbox].
 *
 * @param label Shown to the right. The whole row toggles, not only the track.
 */
@Composable
fun Switch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    enabled: Boolean = true,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val track = when {
        !enabled -> colors.switchDisabledTrack
        checked -> colors.switchTrackOn
        else -> colors.switchTrack
    }
    val thumb = sizes.switchHeight - Inset * 2
    val travel = sizes.switchWidth - sizes.switchHeight
    val position by animateDpAsState(
        targetValue = if (checked) travel else 0.dp,
        // The thumb settles on a spring, or jumps when the person asked for less motion.
        animationSpec = motionSpec(Motion.springFastDamping, Motion.springFastStiffness),
    )

    Row(
        modifier = modifier
            // The track is smaller than a finger: the pressable area is never under `targetMin`.
            .defaultMinSize(minWidth = sizes.targetMin, minHeight = sizes.targetMin)
            .focusRing(CircleShape)
            .toggleable(
                value = checked,
                interactionSource = null,
                indication = null,
                enabled = enabled,
                role = Role.Switch,
                onValueChange = onCheckedChange,
            ),
        horizontalArrangement = Arrangement.spacedBy(Space.s2),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(sizes.switchWidth, sizes.switchHeight).background(track, CircleShape).padding(Inset)) {
            // The position says on or off as well as the track's color does.
            Box(
                Modifier
                    .offset(x = position)
                    .size(thumb)
                    .background(if (enabled) colors.switchThumb else colors.switchDisabledThumb, CircleShape),
            )
        }
        if (label != null) Text(label, style = Typography.body, tone = if (enabled) TextTone.Primary else TextTone.Secondary)
    }
}
