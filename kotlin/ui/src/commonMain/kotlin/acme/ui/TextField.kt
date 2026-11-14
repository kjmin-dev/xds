package acme.ui

import acme.tokens.Border
import acme.tokens.Colors
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
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.coerceAtLeast
import androidx.compose.ui.unit.dp

/**
 * A labelled text field: one line, or several with `multiline`.
 *
 * @param label Always visible. A placeholder is not a label: it disappears as soon as the person
 *   types.
 * @param description Help shown under the field. Replaced by `error` while there is one.
 * @param error What is wrong and how to fix it. Clear it when the value changes.
 * @param secure Hides the characters, for passwords.
 * @param onSubmit Called when the person presses the keyboard's return key.
 * @param leading Drawn inside the field before the text: an icon, a unit. [Icon] and [Text]
 *   take the placeholder's color unless they are given their own.
 * @param trailing Drawn inside the field after the text: an icon, a unit, a small button.
 * @param multiline Makes the field a text area, `rows` lines tall. More text scrolls inside it.
 * @param maxLength The field takes no more characters than this, and shows how many of them
 *   are used under its end edge.
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
    leading: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
    multiline: Boolean = false,
    rows: Int = 3,
    maxLength: Int? = null,
) {
    FieldFrame(
        label = label,
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        labelShown = true,
        shape = RoundedCornerShape(Radius.md),
        description = description,
        error = error,
        placeholder = placeholder,
        enabled = enabled,
        secure = secure,
        keyboardOptions = keyboardOptions,
        onSubmit = onSubmit,
        leading = leading,
        trailing = trailing,
        multiline = multiline,
        rows = rows,
        maxLength = maxLength,
    )
}

/**
 * The field itself, which [TextField] and [SearchField] both are: the box, its slots, and the
 * lines above and below it.
 *
 * @param labelShown False leaves the label to the screen reader, for a field whose purpose its
 *   look already tells.
 * @param inputModifier Goes on the part that takes the text, where focus is.
 * @param endPadding Between the trailing slot and the box's edge, for a slot that holds a
 *   control with a margin of its own.
 */
@Composable
internal fun FieldFrame(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier,
    labelShown: Boolean,
    shape: Shape,
    description: String?,
    error: String?,
    placeholder: String?,
    enabled: Boolean,
    secure: Boolean,
    keyboardOptions: KeyboardOptions,
    onSubmit: (() -> Unit)?,
    leading: (@Composable () -> Unit)?,
    trailing: (@Composable () -> Unit)?,
    multiline: Boolean,
    rows: Int,
    maxLength: Int?,
    inputModifier: Modifier = Modifier,
    endPadding: Dp = Space.s3,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val lines = if (multiline) rows.coerceAtLeast(1) else 1
    // One line of text, which grows with the system's text size.
    val line = with(LocalDensity.current) { Typography.body.lineHeight.toDp() }
    // What centers a single line in the box. A text area keeps it above its first line and
    // below its last, so the first line sits where a one-line field has its text.
    val inset = ((sizes.controlMd - line) / 2).coerceAtLeast(0.dp)

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        if (labelShown) FieldLabel(label, enabled)
        BasicTextField(
            value = value,
            onValueChange = { next ->
                when {
                    maxLength == null || next.length <= maxLength -> onValueChange(next)
                    // A paste into a field with room left fills what room there is.
                    value.length < maxLength -> onValueChange(limited(next, maxLength))
                    // Full: the keystroke is dropped rather than pushing the last character out.
                    else -> Unit
                }
            },
            modifier = inputModifier.fillMaxWidth().semantics {
                contentDescription = label
                if (error != null) error(error)
            },
            enabled = enabled,
            singleLine = !multiline,
            // Both, so the area is `rows` lines tall whatever it holds and scrolls beyond that.
            minLines = lines,
            maxLines = lines,
            textStyle = Typography.body.resolved(if (enabled) colors.fieldText else colors.textDisabled),
            cursorBrush = SolidColor(colors.fieldText),
            visualTransformation = if (secure) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = keyboardOptions,
            // Without `onSubmit` the return key keeps what the system does with it.
            keyboardActions = if (onSubmit != null) KeyboardActions(onAny = { onSubmit() }) else KeyboardActions.Default,
            interactionSource = interactions,
            decorationBox = { input ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = sizes.controlMd)
                        .fieldBox(colors, shape, enabled, focused, invalid = error != null)
                        .padding(start = Space.s3, end = endPadding)
                        .padding(vertical = if (multiline) inset else 0.dp),
                    horizontalArrangement = Arrangement.spacedBy(Space.s2),
                    verticalAlignment = if (multiline) Alignment.Top else Alignment.CenterVertically,
                ) {
                    if (leading != null) Slot(line, multiline, leading)
                    Box(
                        modifier = Modifier.weight(1f),
                        contentAlignment = if (multiline) Alignment.TopStart else Alignment.CenterStart,
                    ) {
                        if (value.isEmpty() && placeholder != null) {
                            BasicText(
                                text = placeholder,
                                style = Typography.body.resolved(colors.fieldPlaceholder),
                                maxLines = lines,
                            )
                        }
                        input()
                    }
                    if (trailing != null) Slot(line, multiline, trailing)
                }
            },
        )
        FieldHelp(error, description, counter = maxLength?.let { "${value.length}/$it" })
    }
}

/** The label above a field, which [Select] and [RadioGroup] put above theirs as well. */
@Composable
internal fun FieldLabel(label: String, enabled: Boolean, modifier: Modifier = Modifier) {
    Text(label, modifier, Typography.label, if (enabled) TextTone.Primary else TextTone.Secondary)
}

/**
 * The line under a field: the error, or else the help, and the counter at the end edge. Draws
 * nothing when there is none of them.
 */
@Composable
internal fun FieldHelp(error: String?, description: String?, counter: String? = null) {
    if (error == null && description == null && counter == null) return
    // The counter keeps to the end edge, on the line the help or the error starts.
    Row(horizontalArrangement = Arrangement.spacedBy(Space.s3)) {
        when {
            error != null -> Text(
                error,
                // Announced when it appears, without interrupting what is being read.
                modifier = Modifier.weight(1f).alignByBaseline().semantics { liveRegion = LiveRegionMode.Polite },
                style = Typography.detail,
                tone = TextTone.Danger,
            )
            description != null -> Text(
                description,
                modifier = Modifier.weight(1f).alignByBaseline(),
                style = Typography.detail,
                tone = TextTone.Secondary,
            )
            else -> Spacer(Modifier.weight(1f))
        }
        if (counter != null) {
            Text(counter, Modifier.alignByBaseline(), Typography.footnote, TextTone.Secondary)
        }
    }
}

/**
 * The box of a field: its fill, and an outline that changes with focus and errors. Focus and
 * errors thicken the outline as well as recoloring it, so neither depends on color alone. The
 * outline is drawn inside the box's bounds, so what is in it does not move.
 */
internal fun Modifier.fieldBox(colors: Colors, shape: Shape, enabled: Boolean, focused: Boolean, invalid: Boolean): Modifier {
    val outline = when {
        invalid -> colors.fieldBorderInvalid
        focused -> colors.fieldBorderFocus
        else -> colors.fieldBorder
    }
    return this
        .background(if (enabled) colors.fieldBackground else colors.backgroundDisabled, shape)
        .border(if (focused || invalid) Border.widthThick else Border.widthThin, outline, shape)
}

/**
 * A slot inside the field's box. In a text area it takes the height of the first line and is
 * centered on it, however tall its content is, so it lines up with the text and adds nothing to
 * the height of the box.
 */
@Composable
private fun Slot(line: Dp, multiline: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalContentColor provides LocalColors.current.fieldPlaceholder) {
        Box(
            modifier = if (multiline) {
                Modifier.height(line).wrapContentHeight(Alignment.CenterVertically, unbounded = true)
            } else {
                Modifier
            },
            contentAlignment = Alignment.Center,
        ) {
            content()
        }
    }
}

/**
 * The first [max] characters of [text]. A letter outside the basic plane is two characters and
 * is kept whole or left out whole.
 */
internal fun limited(text: String, max: Int): String {
    if (text.length <= max) return text
    val end = if (max > 0 && text[max - 1].isHighSurrogate()) max - 1 else max
    return text.substring(0, end.coerceAtLeast(0))
}
