package acme.ui

import acme.tokens.Border
import acme.tokens.Colors
import acme.tokens.IconName
import acme.tokens.Motion
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
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
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
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

private fun selectedLook(colors: Colors) = ButtonLook(
    background = colors.buttonSelectedBackground,
    hover = colors.buttonSelectedBackgroundHover,
    pressed = colors.buttonSelectedBackgroundPressed,
    text = colors.buttonSelectedText,
)

/**
 * @param label The visible label. It is also what a screen reader says.
 * @param loading Shows a spinner and ignores presses. The label stays, so the button keeps its
 *   width, and so do the colors: the action was accepted, which is the opposite of unavailable.
 * @param fullWidth Stretches to the width of its container. Without it the button is as wide as
 *   its label.
 * @param iconStart Drawn before the label, in the label's color. The spinner takes its place
 *   while `loading`.
 * @param iconEnd Drawn after the label, in the label's color.
 * @param selected Makes the button a toggle that tells a screen reader whether it is on: a like,
 *   a filter. Leave it null for a button that only acts. While true, a secondary or ghost button
 *   is tinted and outlined and its `iconStart` is filled; a primary or danger button keeps its
 *   look. The button does not flip the value itself: `onClick` does.
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
    iconStart: IconName? = null,
    iconEnd: IconName? = null,
    selected: Boolean? = null,
) {
    val sizes = LocalSizes.current
    val iconSize = if (size == ControlSize.Lg) IconSize.Md else IconSize.Sm
    ButtonFrame(
        onClick = onClick,
        modifier = modifier,
        variant = variant,
        size = size,
        enabled = enabled,
        loading = loading,
        fullWidth = fullWidth,
        selected = selected,
        name = null,
    ) { text, on ->
        when {
            // In a box the size of the icon it replaces, so the label does not move.
            loading && iconStart != null -> Box(
                Modifier.size(if (size == ControlSize.Lg) sizes.iconMd else sizes.iconSm),
                contentAlignment = Alignment.Center,
            ) {
                SpinnerArc(color = text, diameter = sizes.spinnerSm)
            }
            loading -> SpinnerArc(color = text, diameter = sizes.spinnerSm)
            // Filled while selected, so the state shows in the form and not in the color alone.
            iconStart != null -> Icon(iconStart, size = iconSize, color = text, filled = on)
        }
        BasicText(
            text = label,
            // The label gives way first, so a long one does not push the end icon out.
            modifier = Modifier.weight(1f, fill = false),
            style = (if (size == ControlSize.Lg) Typography.bodyStrong else Typography.label).resolved(text),
            overflow = TextOverflow.Ellipsis,
            maxLines = 1,
        )
        if (iconEnd != null) Icon(iconEnd, size = iconSize, color = text)
    }
}

/**
 * The fill, outline, shape and press handling every button shares, [IconButton] included.
 *
 * @param name Set for a button without a label: it is then a square as wide as it is tall, and
 *   this is what a screen reader says.
 * @param content Given the color of the label, and whether the selected look is drawn.
 */
@Composable
internal fun ButtonFrame(
    onClick: () -> Unit,
    modifier: Modifier,
    variant: ButtonVariant,
    size: ControlSize,
    enabled: Boolean,
    loading: Boolean,
    fullWidth: Boolean,
    selected: Boolean?,
    name: String?,
    content: @Composable RowScope.(text: Color, on: Boolean) -> Unit,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    // Primary and danger buttons are already filled: they report the state and keep their look.
    val on = selected == true && (variant == ButtonVariant.Secondary || variant == ButtonVariant.Ghost)
    val look = if (on) selectedLook(colors) else look(colors, variant)
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
    // Disabled is recolored, not faded: a faded colored fill still looks pressable. It also
    // wins over selected, so a button that cannot be pressed never looks as if it could.
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
    // shadow set it apart. Disabled, it has its own fill and neither. A selected button is
    // outlined in the accent, which marks it together with the tint.
    val outline = when {
        !enabled -> null
        on -> colors.buttonSelectedBorder
        variant == ButtonVariant.Secondary -> colors.buttonSecondaryBorder
        else -> null
    }
    // Filled buttons carry the same trace of shadow, so none looks flatter than the outlined one.
    val raised = variant != ButtonVariant.Ghost && enabled
    // Shrinks a little while pressed: feedback that does not depend on color.
    val scale by animateFloatAsState(
        targetValue = if (pressed && enabled) Motion.pressScale else 1f,
        animationSpec = motionSpec(Motion.springFastDamping, Motion.springFastStiffness),
    )
    // Compose has no "busy" state to announce, so a loading button reads as disabled.
    val reacts = enabled && !loading
    // A minimum, not a height: the label may grow with the system's text size. A small button
    // still reacts to a touch anywhere in the minimum target around it, which the theme's view
    // configuration takes care of, for one without a label as well.
    val least = max(height, sizes.targetMin)
    val menu = LocalMenuTrigger.current

    Row(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            .then(if (name != null) Modifier.size(height) else Modifier.defaultMinSize(minWidth = least, minHeight = height))
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .focusRing(shape)
            .then(if (raised) Modifier.shadow(Shadow.subtle, shape) else Modifier)
            .background(fill, shape)
            .then(if (outline != null) Modifier.border(Border.widthThin, outline, shape) else Modifier)
            // No ripple or overlay: the pressed and hover colors are tokens.
            .then(
                if (selected != null) {
                    // The caller owns the value, so a press only asks for the change.
                    Modifier.toggleable(
                        value = selected,
                        interactionSource = interactions,
                        indication = null,
                        enabled = reacts,
                        role = Role.Button,
                        onValueChange = { onClick() },
                    )
                } else {
                    Modifier.clickable(
                        interactionSource = interactions,
                        indication = null,
                        enabled = reacts,
                        role = Role.Button,
                        onClick = onClick,
                    )
                },
            )
            .then(
                // The button that opens a menu says so, and whether the menu is open: a screen
                // reader calls it collapsed or expanded.
                if (menu != null) {
                    Modifier.semantics {
                        if (menu.open) collapse { menu.setOpen(false); true } else expand { menu.setOpen(true); true }
                    }
                } else {
                    Modifier
                },
            )
            .then(if (name != null) Modifier.semantics { contentDescription = name } else Modifier.padding(horizontal = padding)),
        horizontalArrangement = Arrangement.spacedBy(Space.s2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        content(text, on)
    }
}
