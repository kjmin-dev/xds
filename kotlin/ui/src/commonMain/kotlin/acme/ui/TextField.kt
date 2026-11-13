package acme.ui

import acme.tokens.Border
import acme.tokens.Radius
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation

/**
 * A labelled single-line text field.
 *
 * @param label Always visible. A placeholder is not a label: it disappears as soon as the person
 *   types.
 * @param description Help shown under the field. Replaced by `error` while there is one.
 * @param error What is wrong and how to fix it. Clear it when the value changes.
 * @param secure Hides the characters, for passwords.
 * @param onSubmit Called when the person presses the keyboard's return key.
 */
@Composable
fun TextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    error: String? = null,
    placeholder: String? = null,
    enabled: Boolean = true,
    secure: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    onSubmit: (() -> Unit)? = null,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val invalid = error != null
    // Focus and errors thicken the outline as well as recoloring it, so neither depends on color
    // alone. The outline is drawn inside the field's bounds, so the text does not move.
    val outline = if (focused || invalid) Border.widthThick else Border.widthThin
    val outlineColor = when {
        invalid -> colors.fieldBorderInvalid
        focused -> colors.fieldBorderFocus
        else -> colors.fieldBorder
    }
    val shape = RoundedCornerShape(Radius.md)

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        Text(label, style = Typography.label, tone = if (enabled) TextTone.Primary else TextTone.Secondary)
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().semantics {
                contentDescription = label
                if (error != null) error(error)
            },
            enabled = enabled,
            singleLine = true,
            textStyle = Typography.body.resolved(if (enabled) colors.fieldText else colors.textDisabled),
            cursorBrush = SolidColor(colors.fieldText),
            visualTransformation = if (secure) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = keyboardOptions,
            // Without `onSubmit` the return key keeps what the system does with it.
            keyboardActions = if (onSubmit != null) KeyboardActions(onAny = { onSubmit() }) else KeyboardActions.Default,
            interactionSource = interactions,
            decorationBox = { input ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = sizes.controlMd)
                        .background(if (enabled) colors.fieldBackground else colors.backgroundDisabled, shape)
                        .border(outline, outlineColor, shape)
                        .padding(horizontal = Space.s3),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    if (value.isEmpty() && placeholder != null) {
                        BasicText(placeholder, style = Typography.body.resolved(colors.fieldPlaceholder), maxLines = 1)
                    }
                    input()
                }
            },
        )
        if (error != null) {
            // Announced when it appears, without interrupting what is being read.
            Text(
                error,
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                style = Typography.detail,
                tone = TextTone.Danger,
            )
        } else if (description != null) {
            Text(description, style = Typography.detail, tone = TextTone.Secondary)
        }
    }
}
