package acme.ui

import acme.tokens.Border
import acme.tokens.Colors
import acme.tokens.Motion
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max

enum class ButtonVariant {
    /** The one action a screen is for. Use it once per screen. */
    Primary,

    /** Any other action. */
    Secondary,

    /** An action that should stay out of the way. */
    Ghost,

    /** An action that destroys something. */
    Danger,
}

/** The three control heights. What each measures depends on the input device. */
enum class ControlSize { Sm, Md, Lg }

private class ButtonLook(val background: Color, val hover: Color, val pressed: Color, val text: Color)

private fun look(colors: Colors, variant: ButtonVariant): ButtonLook = when (variant) {
    ButtonVariant.Primary -> ButtonLook(
        background = colors.buttonPrimaryBackground,
        hover = colors.buttonPrimaryBackgroundHover,
        pressed = colors.buttonPrimaryBackgroundPressed,
        text = colors.buttonPrimaryText,
    )
    ButtonVariant.Secondary -> ButtonLook(
        background = colors.buttonSecondaryBackground,
        hover = colors.buttonSecondaryBackgroundHover,
        pressed = colors.buttonSecondaryBackgroundPressed,
        text = colors.buttonSecondaryText,
    )
    ButtonVariant.Ghost -> ButtonLook(
        background = Color.Transparent,
        hover = colors.buttonGhostBackgroundHover,
        pressed = colors.buttonGhostBackgroundPressed,
        text = colors.buttonGhostText,
    )
    ButtonVariant.Danger -> ButtonLook(
        background = colors.buttonDangerBackground,
        hover = colors.buttonDangerBackgroundHover,
        pressed = colors.buttonDangerBackgroundPressed,
        text = colors.buttonDangerText,
    )
}

/**
 * @param label The visible label. It is also what a screen reader says.
 * @param loading Shows a spinner and ignores presses. The label stays, so the button keeps its
 *   width, and so do the colors: the action was accepted, which is the opposite of unavailable.
 * @param fullWidth Stretches to the width of its container. Without it the button is as wide as
 *   its label.
 */
@Composable
fun Button(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Secondary,
    size: ControlSize = ControlSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    fullWidth: Boolean = false,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val look = look(colors, variant)
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()

    val height = when (size) {
        ControlSize.Sm -> sizes.controlSm
        ControlSize.Md -> sizes.controlMd
        ControlSize.Lg -> sizes.controlLg
    }
    val padding = when (size) {
        ControlSize.Sm -> Space.s3
        ControlSize.Md -> Space.s4
        ControlSize.Lg -> Space.s6
    }
    // Disabled is recolored, not faded: a faded colored fill still looks pressable.
    val fill = when {
        !enabled -> if (variant == ButtonVariant.Ghost) Color.Transparent else colors.buttonDisabledBackground
        pressed -> look.pressed
        hovered -> look.hover
        else -> look.background
    }
    val text = if (enabled) look.text else colors.buttonDisabledText
    // A capsule on touch, a rounded rectangle with a pointer. The shape never rounds a corner
    // by more than half the button's height, so the capsule's large radius needs no clamping.
    val shape = RoundedCornerShape(sizes.buttonRadius)
    // A secondary button is the color of the surface it sits on, so an outline and a faint
    // shadow set it apart. Disabled, it has its own fill and neither.
    val outlined = variant == ButtonVariant.Secondary && enabled
    // Shrinks a little while pressed: feedback that does not depend on color.
    val scale by animateFloatAsState(
        targetValue = if (pressed && enabled) Motion.pressScale else 1f,
        animationSpec = tween(Motion.durationFast, easing = Motion.easingStandard),
    )

    Row(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            // A minimum, not a height: the label may grow with the system's text size. A small
            // button still reacts to a touch anywhere in the minimum target around it, which
            // the theme's view configuration takes care of.
            .defaultMinSize(minWidth = max(height, sizes.targetMin), minHeight = height)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .focusRing(shape)
            .then(if (outlined) Modifier.shadow(Shadow.subtle, shape) else Modifier)
            .background(fill, shape)
            .then(if (outlined) Modifier.border(Border.widthThin, colors.buttonSecondaryBorder, shape) else Modifier)
            // No ripple or overlay: the pressed and hover colors are tokens.
            .clickable(
                interactionSource = interactions,
                indication = null,
                // Compose has no "busy" state to announce, so a loading button reads as disabled.
                enabled = enabled && !loading,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = padding),
        horizontalArrangement = Arrangement.spacedBy(Space.s2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (loading) SpinnerArc(color = text, diameter = 16.dp)
        BasicText(
            text = label,
            style = (if (size == ControlSize.Lg) Typography.bodyStrong else Typography.label).resolved(text),
            overflow = TextOverflow.Ellipsis,
            maxLines = 1,
        )
    }
}
