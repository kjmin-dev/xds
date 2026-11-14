package acme.ui

import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Space
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.text.input.ImeAction

/**
 * A text field for a query: a pill with a search mark and, while it holds a value, a control
 * that clears it.
 *
 * @param label Names the field for a screen reader. It is not shown: the search mark and the
 *   placeholder say what the field is for.
 * @param onSubmit Called for Enter, or the search key of an on-screen keyboard.
 * @param clearLabel Names the control that empties the field.
 */
@Composable
fun SearchField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    enabled: Boolean = true,
    onSubmit: (() -> Unit)? = null,
    clearLabel: String = "Clear",
) {
    val sizes = LocalSizes.current
    val focus = remember { FocusRequester() }
    // A field that cannot be typed in cannot be emptied either.
    val clearable = enabled && value.isNotEmpty()
    FieldFrame(
        label = label,
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        labelShown = false,
        shape = RoundedCornerShape(Radius.full),
        description = null,
        error = null,
        placeholder = placeholder,
        enabled = enabled,
        secure = false,
        // The keyboard's return key says "search" where the system has such a key.
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        onSubmit = onSubmit,
        leading = { Icon(IconName.Search, size = IconSize.Sm) },
        trailing = if (clearable) {
            {
                IconButton(
                    icon = IconName.CircleX,
                    label = clearLabel,
                    onClick = {
                        onValueChange("")
                        // Pressing a button with a mouse moves focus to it. The person is still
                        // searching, so the field takes it back.
                        focus.requestFocus()
                    },
                    size = ControlSize.Sm,
                )
            }
        } else {
            null
        },
        multiline = false,
        rows = 1,
        maxLength = null,
        inputModifier = Modifier.focusRequester(focus),
        // The clear control sits as far from the end of the pill as from its top and bottom.
        endPadding = if (clearable) (sizes.controlMd - sizes.controlSm) / 2 else Space.s3,
    )
}
