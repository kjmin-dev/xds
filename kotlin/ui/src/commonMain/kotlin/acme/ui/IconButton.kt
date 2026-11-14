package acme.ui

import acme.tokens.IconName
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

/**
 * A button that holds only an icon: a square as wide as a [Button] of the same size is tall,
 * with its shape, its colors and its press feedback. Where the square is smaller than the
 * minimum target, a touch anywhere in the target around it still reaches the button.
 *
 * @param label Names the button for a screen reader: the icon is a drawing, and there is no
 *   visible text.
 * @param loading Shows a spinner in the icon's place and ignores presses.
 * @param selected Makes the button a toggle that tells a screen reader whether it is on. Leave
 *   it null for a button that only acts. While true, a secondary or ghost button is tinted and
 *   outlined and its icon is filled. The button does not flip the value itself: `onClick` does.
 */
@Composable
fun IconButton(
    icon: IconName,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Ghost,
    size: ControlSize = ControlSize.Md,
    enabled: Boolean = true,
    loading: Boolean = false,
    selected: Boolean? = null,
) {
    val sizes = LocalSizes.current
    ButtonFrame(
        onClick = onClick,
        modifier = modifier,
        variant = variant,
        size = size,
        enabled = enabled,
        loading = loading,
        fullWidth = false,
        selected = selected,
        name = label,
    ) { text, on ->
        if (loading) {
            // As large as the icon it replaces, so the two read as one mark changing.
            val side = when (size) {
                ControlSize.Sm -> sizes.iconSm
                ControlSize.Md -> sizes.iconMd
                ControlSize.Lg -> sizes.iconLg
            }
            SpinnerArc(color = text, diameter = side)
        } else {
            val iconSize = when (size) {
                ControlSize.Sm -> IconSize.Sm
                ControlSize.Md -> IconSize.Md
                ControlSize.Lg -> IconSize.Lg
            }
            // Filled while selected, so the state shows in the form and not in the color alone.
            Icon(icon, size = iconSize, color = text, filled = on)
        }
    }
}
