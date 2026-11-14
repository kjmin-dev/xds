package acme.ui

import acme.tokens.Border
import acme.tokens.IconName
import acme.tokens.Radius
import acme.tokens.Shadow
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/** One entry of a [Menu]: an [Action] or a [Separator]. */
sealed interface MenuItem {
    /**
     * Something the menu offers to do.
     *
     * @param onSelect Called when the item is chosen. The menu closes itself.
     * @param icon Drawn before the label.
     * @param danger For an action that destroys something: drawn in the danger color.
     * @param enabled False shows the item, and pressing it does nothing.
     * @param selected Marks the current choice among the items with a check at the end of the
     *   row, so the choice does not depend on color. A screen reader says it as well.
     */
    class Action(
        val label: String,
        val onSelect: () -> Unit,
        val icon: IconName? = null,
        val danger: Boolean = false,
        val enabled: Boolean = true,
        val selected: Boolean = false,
    ) : MenuItem

    /** A line between two groups of items. */
    data object Separator : MenuItem
}

/** The edge of the trigger a [Menu]'s popup lines up with. */
enum class MenuAlign { Start, End }

/**
 * A list of actions that opens from a control. With a pointer it is a popup under the trigger,
 * as wide as its longest row; on touch the same items are rows of a [BottomSheet] titled with
 * `label`. Choosing an item calls its `onSelect` and closes the menu. A press outside, Escape
 * and Back close it without choosing.
 *
 * @param label Names the menu for a screen reader. On touch it is also the sheet's title.
 * @param align The edge of the trigger the popup lines up with. The sheet spans the screen, so
 *   it does not follow it.
 * @param trigger The control that opens the menu, usually a [Button] or an [IconButton]. It is
 *   given the function that opens the menu, for its `onClick`. A Button or an IconButton also
 *   tells a screen reader that it opens a menu, and whether the menu is open.
 */
@Composable
fun Menu(
    label: String,
    items: List<MenuItem>,
    modifier: Modifier = Modifier,
    align: MenuAlign = MenuAlign.Start,
    trigger: @Composable (open: () -> Unit) -> Unit,
) {
    Menu(label, items, modifier, align, initiallyOpen = false, trigger)
}

/** @param initiallyOpen Starts with the menu open, for drawing it into an image. */
@Composable
internal fun Menu(
    label: String,
    items: List<MenuItem>,
    modifier: Modifier,
    align: MenuAlign,
    initiallyOpen: Boolean,
    trigger: @Composable (open: () -> Unit) -> Unit,
) {
    var open by remember { mutableStateOf(initiallyOpen) }
    val close = { open = false }
    Box(modifier) {
        CompositionLocalProvider(LocalMenuTrigger provides MenuTrigger(open) { open = it }) {
            trigger { open = true }
        }
        MenuList(label, open, onClose = close, align = align) { compact ->
            for (item in items) MenuEntry(item, compact, onChosen = close)
        }
    }
}

/**
 * The list of a [Menu], and of anything else that opens a list the way a menu does, such as a
 * [Select]. With a pointer it is a popup under the box it is composed in; on touch it is a
 * [BottomSheet] titled with [label]. A press outside, Escape and Back call [onClose]. Long lists
 * scroll in either form.
 *
 * @param width The popup's width. Without it the popup is as wide as its longest row.
 * @param listModifier Goes on what holds the rows, in either form, for what a screen reader is
 *   told about the list as a whole.
 * @param rows Told whether they are the popup's compact rows or the sheet's full ones.
 */
@Composable
internal fun MenuList(
    label: String,
    open: Boolean,
    onClose: () -> Unit,
    align: MenuAlign = MenuAlign.Start,
    width: Dp? = null,
    listModifier: Modifier = Modifier,
    rows: @Composable (compact: Boolean) -> Unit,
) {
    // The form goes with the sizes: rows sized for a finger are never squeezed into a popup.
    if (LocalSizes.current.forPointer) {
        if (open) MenuPopup(label, align, width, listModifier, onClose) { rows(true) }
    } else {
        BottomSheet(open = open, onDismiss = onClose, title = label) {
            // The rows reach into the sheet's padding, so their text lines up with the title
            // while their fill stays clear of the sheet's rounded corners. They give way to the
            // title when there are more than fit on the screen.
            Column(
                Modifier
                    .weight(1f, fill = false)
                    .reach(Space.s3)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .then(listModifier),
            ) {
                rows(false)
            }
        }
    }
}

@Composable
private fun MenuPopup(
    label: String,
    align: MenuAlign,
    width: Dp?,
    listModifier: Modifier,
    onClose: () -> Unit,
    rows: @Composable () -> Unit,
) {
    val colors = LocalColors.current
    val gap = with(LocalDensity.current) { Space.s1.roundToPx() }
    val position = remember(align, gap) { MenuPosition(align, gap) }
    val shape = RoundedCornerShape(Radius.md)
    Popup(
        popupPositionProvider = position,
        onDismissRequest = onClose,
        // Focusable, so that Escape reaches it and a press outside closes it.
        properties = PopupProperties(focusable = true),
    ) {
        Column(
            Modifier
                .then(
                    if (width != null) {
                        Modifier.width(width)
                    } else {
                        // Four times `space.12`: wide enough that a menu of short words does not
                        // look like a stack of chips. Beyond that it is as wide as its longest row.
                        Modifier.widthIn(min = Space.s12 * 4).width(IntrinsicSize.Max)
                    },
                )
                .shadow(Shadow.raised, shape)
                .background(colors.menuBackground, shape)
                .border(Border.widthThin, colors.menuBorder, shape)
                .semantics { paneTitle = label }
                // Inside the outline, so the outline stays put while the rows scroll.
                .verticalScroll(rememberScrollState())
                .padding(Space.s1)
                .then(listModifier),
        ) {
            rows()
        }
    }
}

/** @param compact A popup's row, like a compact list row. Otherwise a full list row, for a sheet. */
@Composable
private fun MenuEntry(item: MenuItem, compact: Boolean, onChosen: () -> Unit) {
    when (item) {
        // In a sheet it starts and ends where the rows' text does.
        MenuItem.Separator -> Box(
            Modifier
                .fillMaxWidth()
                .padding(vertical = Space.s1, horizontal = if (compact) 0.dp else Space.s3)
                .height(Border.widthThin)
                .background(LocalColors.current.menuBorder),
        )
        is MenuItem.Action -> MenuRow(
            label = item.label,
            onClick = {
                item.onSelect()
                onChosen()
            },
            compact = compact,
            icon = item.icon,
            danger = item.danger,
            enabled = item.enabled,
            selected = item.selected,
        )
    }
}

/**
 * One row of a [MenuList].
 *
 * @param compact A popup's row, like a compact list row. Otherwise a full list row, for a sheet.
 * @param description A second line under the label, in the secondary color.
 * @param selected Marks the current choice with a check at the end of the row, so the choice
 *   does not depend on color. A screen reader says it as well.
 * @param option For a choice in a list, such as a [Select]'s: a screen reader hears whether it is
 *   selected, rather than that it is a button.
 */
@Composable
internal fun MenuRow(
    label: String,
    onClick: () -> Unit,
    compact: Boolean,
    modifier: Modifier = Modifier,
    icon: IconName? = null,
    description: String? = null,
    danger: Boolean = false,
    enabled: Boolean = true,
    selected: Boolean = false,
    option: Boolean = false,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val focused by interactions.collectIsFocusedAsState()
    // The keyboard moves the same highlight as the pointer. It is a fill rather than a ring,
    // which would stick out of the menu.
    val highlighted = hovered || (focused && LocalInputModeManager.current.inputMode == InputMode.Keyboard)
    val fill = when {
        !enabled -> Color.Transparent
        // One token for both: a neutral fill would not carry the danger text in dark mode.
        danger && (pressed || highlighted) -> colors.menuDangerBackgroundHover
        pressed -> colors.menuItemBackgroundPressed
        highlighted -> colors.menuItemBackgroundHover
        else -> Color.Transparent
    }
    // Recolored, not faded, like a disabled button. Disabled and danger take the icon along.
    val text = when {
        !enabled -> colors.menuTextDisabled
        danger -> colors.menuDangerText
        else -> colors.menuText
    }
    val iconColor = if (enabled && !danger) colors.menuIcon else text
    val iconSize = if (compact) IconSize.Sm else IconSize.Md

    Row(
        modifier = modifier
            .fillMaxWidth()
            // A minimum, not a height: the label may grow with the system's text size.
            .heightIn(min = if (compact) sizes.listRowCompact else sizes.listRow)
            .background(fill, RoundedCornerShape(if (compact) Radius.sm else Radius.md))
            .then(
                if (option) {
                    Modifier.selectable(
                        selected = selected,
                        interactionSource = interactions,
                        indication = null,
                        enabled = enabled,
                        onClick = onClick,
                    )
                } else {
                    Modifier
                        .semantics { if (selected) this.selected = true }
                        .clickable(
                            interactionSource = interactions,
                            // No ripple or overlay: the pressed and hover colors are tokens.
                            indication = null,
                            enabled = enabled,
                            role = Role.Button,
                            onClick = onClick,
                        )
                },
            )
            .padding(
                horizontal = if (compact) Space.s2 else Space.s3,
                vertical = if (compact) Space.s1 else Space.s2,
            ),
        horizontalArrangement = Arrangement.spacedBy(if (compact) Space.s2 else Space.s3),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) Icon(icon, size = iconSize, color = iconColor)
        Column(Modifier.weight(1f)) {
            BasicText(
                text = label,
                style = (if (compact) Typography.detail else Typography.body).resolved(text),
                overflow = TextOverflow.Ellipsis,
                maxLines = 1,
            )
            if (description != null) {
                BasicText(
                    text = description,
                    style = (if (compact) Typography.footnote else Typography.detail)
                        .resolved(if (enabled) colors.textSecondary else colors.menuTextDisabled),
                )
            }
        }
        // A mark, so the current choice does not depend on color.
        if (selected) Icon(IconName.Check, size = iconSize, color = text)
    }
}

/**
 * Under the trigger, [gap] away from it, with the edges [align] names lined up. Above the
 * trigger when there is no room below it but there is above, and kept inside the window when
 * there is room on neither side. Never past the window's sides.
 */
private class MenuPosition(private val align: MenuAlign, private val gap: Int) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize,
    ): IntOffset {
        val leftEdges = (align == MenuAlign.Start) == (layoutDirection == LayoutDirection.Ltr)
        val x = if (leftEdges) anchorBounds.left else anchorBounds.right - popupContentSize.width
        val below = anchorBounds.bottom + gap
        val above = anchorBounds.top - gap - popupContentSize.height
        val y = if (below + popupContentSize.height > windowSize.height && above >= 0) above else below
        return IntOffset(
            x.coerceIn(0, (windowSize.width - popupContentSize.width).coerceAtLeast(0)),
            y.coerceIn(0, (windowSize.height - popupContentSize.height).coerceAtLeast(0)),
        )
    }
}

/** Widens what it is on by [by] at both sides, into the padding of what holds it. */
private fun Modifier.reach(by: Dp): Modifier = layout { measurable, constraints ->
    val reach = by.roundToPx()
    val placeable = measurable.measure(constraints.offset(horizontal = 2 * reach))
    layout(placeable.width - 2 * reach, placeable.height) { placeable.place(-reach, 0) }
}

/** What a [Menu] tells the button that opens it: whether it is open, and how to change that. */
internal class MenuTrigger(val open: Boolean, val setOpen: (Boolean) -> Unit)

/** Set around a menu's trigger only, so the buttons inside the menu do not take it up. */
internal val LocalMenuTrigger = compositionLocalOf<MenuTrigger?> { null }
