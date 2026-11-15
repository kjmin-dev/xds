package acme.ui

import acme.tokens.Border
import acme.tokens.Focus
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
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import kotlin.time.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.YearMonth
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn
import kotlinx.datetime.yearMonth

/**
 * A field for choosing one day. Closed, it looks like a [Select]: the chosen day in the locale's
 * medium form, or the placeholder. Pressing it opens a calendar of one month on the chosen day,
 * or on today when none is chosen, the way a Select opens its list: with a pointer a popup under
 * the field; on touch a [BottomSheet] titled with `label`. Choosing a day calls `onValueChange`
 * and closes the calendar; a press outside, Escape and Back close it without choosing.
 *
 * In the calendar the arrow keys move a day or a week, Page Up and Page Down a month (with Shift
 * a year), Home and End to the first and last day of the month, and Enter or Space chooses. The
 * names of the months and the days, and the day each week starts on, follow the system's locale.
 *
 * @param label Always visible, above the field. A screen reader names the field with it.
 * @param value The chosen day, or null while none is chosen.
 * @param min The first day that can be chosen. Days before it are shown and cannot be chosen.
 * @param max The last day that can be chosen.
 * @param placeholder Shown in the field while nothing is chosen.
 * @param description Help shown under the field. Replaced by `error` while there is one.
 * @param error What is wrong and how to fix it. Clear it when the value changes.
 * @param previousLabel Names the button that shows the month before, for a screen reader.
 * @param nextLabel Names the button that shows the month after.
 */
@Composable
fun DatePicker(
    label: String,
    value: LocalDate?,
    onValueChange: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    min: LocalDate? = null,
    max: LocalDate? = null,
    placeholder: String? = null,
    description: String? = null,
    error: String? = null,
    enabled: Boolean = true,
    previousLabel: String = "Previous month",
    nextLabel: String = "Next month",
) {
    DatePicker(
        label, value, onValueChange, modifier, min, max, placeholder, description, error, enabled,
        previousLabel, nextLabel, initiallyOpen = false,
    )
}

/** @param initiallyOpen Starts with the calendar open, for drawing it into an image. */
@Composable
internal fun DatePicker(
    label: String,
    value: LocalDate?,
    onValueChange: (LocalDate) -> Unit,
    modifier: Modifier,
    min: LocalDate?,
    max: LocalDate?,
    placeholder: String?,
    description: String?,
    error: String?,
    enabled: Boolean,
    previousLabel: String,
    nextLabel: String,
    initiallyOpen: Boolean,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val locale = remember { calendarLocale() }
    var open by remember { mutableStateOf(initiallyOpen) }
    // Opened from the keyboard, the calendar shows where the focus is in it from the start.
    // Opened by a press it does so once a key is used, as a focus ring on the web does.
    var byKeyboard by remember { mutableStateOf(false) }
    val field = remember { FocusRequester() }
    var returnFocus by remember { mutableStateOf(false) }
    val close = {
        open = false
        returnFocus = true
    }
    // Once the calendar is gone, so that the focus has somewhere to go back to. Where a finger is
    // used the field does not take the focus, and the request changes nothing.
    LaunchedEffect(returnFocus) {
        if (returnFocus) {
            field.requestFocus()
            returnFocus = false
        }
    }
    val choose = { day: LocalDate ->
        onValueChange(day)
        close()
    }
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val shown = value?.let(locale::mediumDate) ?: placeholder.orEmpty()
    val textColor = when {
        value == null -> colors.fieldPlaceholder
        enabled -> colors.fieldText
        else -> colors.textDisabled
    }

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Space.s1)) {
        // The field carries the label for a screen reader, which would otherwise hear it twice.
        FieldLabel(label, enabled, Modifier.clearAndSetSemantics {})
        // The calendar's popup lines up with this box, so it holds the field and nothing else.
        Box {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    // A minimum, not a height: the text may grow with the system's text size.
                    .heightIn(min = sizes.controlMd)
                    // While its calendar is open the field looks focused: the calendar belongs to it.
                    .fieldBox(colors, RoundedCornerShape(Radius.md), enabled, focused || open, invalid = error != null)
                    .focusRequester(field)
                    .onPreviewKeyEvent { event ->
                        val opens = enabled && event.type == KeyEventType.KeyDown && event.isChoice()
                        if (opens) {
                            byKeyboard = true
                            open = true
                        }
                        opens
                    }
                    .clickable(
                        interactionSource = interactions,
                        // No ripple or overlay: the field's look is its own.
                        indication = null,
                        enabled = enabled,
                        role = Role.Button,
                        onClick = {
                            byKeyboard = false
                            open = true
                        },
                    )
                    // Inside the press handling, so that what it sets replaces only what the
                    // field draws: the chosen day is said as the field's state, after its name.
                    .clearAndSetSemantics {
                        contentDescription = label
                        if (value != null) stateDescription = locale.mediumDate(value)
                        // A screen reader calls the field collapsed or expanded.
                        if (open) collapse { close(); true } else expand { open = true; true }
                        if (error != null) error(error)
                    }
                    .padding(horizontal = Space.s3),
                horizontalArrangement = Arrangement.spacedBy(Space.s2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(
                    text = shown,
                    modifier = Modifier.weight(1f),
                    style = Typography.body.resolved(textColor),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                )
                Icon(IconName.Calendar, size = IconSize.Sm, color = colors.fieldPlaceholder)
            }
            val calendar = @Composable { calendarModifier: Modifier ->
                Calendar(value, min, max, locale, previousLabel, nextLabel, byKeyboard, choose, calendarModifier)
            }
            // The form goes with the sizes, as a Select's list does.
            if (sizes.forPointer) {
                if (open) CalendarPopup(label, onClose = close) { calendar(Modifier) }
            } else {
                BottomSheet(open = open, onDismiss = close, title = label) { calendar(Modifier.fillMaxWidth()) }
            }
        }
        FieldHelp(error, description)
    }
}

/** The calendar on the menu's surface, under the field, lined up with its start. */
@Composable
private fun CalendarPopup(label: String, onClose: () -> Unit, content: @Composable () -> Unit) {
    val colors = LocalColors.current
    val gap = with(LocalDensity.current) { Space.s1.roundToPx() }
    val position = remember(gap) { MenuPosition(MenuAlign.Start, gap) }
    val shape = RoundedCornerShape(Radius.lg)
    Popup(
        popupPositionProvider = position,
        onDismissRequest = onClose,
        // Focusable, so that the keys reach the calendar and a press outside closes it.
        properties = PopupProperties(focusable = true),
    ) {
        Box(
            Modifier
                .shadow(Shadow.raised, shape)
                .background(colors.datePickerBackground, shape)
                .border(Border.widthThin, colors.borderDefault, shape)
                .semantics { paneTitle = label }
                .padding(Space.s3),
        ) {
            content()
        }
    }
}

/**
 * One month, with buttons for the months before and after it. The focus moves over its days
 * with the keys; only the focused day takes Tab, so Tab goes from it to the two buttons and back.
 *
 * @param byKeyboard Shows the focused day from the start, not only once a key is used.
 */
@Composable
private fun Calendar(
    value: LocalDate?,
    min: LocalDate?,
    max: LocalDate?,
    locale: CalendarLocale,
    previousLabel: String,
    nextLabel: String,
    byKeyboard: Boolean,
    onChoose: (LocalDate) -> Unit,
    modifier: Modifier,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val today = remember { Clock.System.todayIn(TimeZone.currentSystemDefault()) }
    // The day that has the focus, or would have it once the calendar has; the month shown is its.
    var focused by remember { mutableStateOf(openingDay(value, today, min, max)) }
    var showFocus by remember { mutableStateOf(byKeyboard) }
    // Each increase puts the input focus on `focused`, once its cell is there. The first does so
    // as the calendar opens.
    var focusRequests by remember { mutableIntStateOf(1) }
    var hasFocus by remember { mutableStateOf(false) }
    val month = focused.yearMonth
    val weeks = remember(month, locale) { monthWeeks(month, locale.firstDayOfWeek) }
    val requesters = remember(month) { List(month.numberOfDays) { FocusRequester() } }

    fun show(key: CalendarKey) {
        val wasOnDay = hasFocus
        focused = moveFocus(focused, key, min, max)
        if (dayTakesFocus(wasOnDay, key, focused.yearMonth, min, max)) focusRequests++
    }

    BoxWithConstraints(modifier, contentAlignment = Alignment.TopCenter) {
        // In here rather than outside: what this box holds is composed only once its width is
        // known, and the days have to be there before the focus can go to one of them.
        LaunchedEffect(focusRequests) {
            // A frame later as well: a popup takes the focus for itself as it appears, which
            // would undo a request made before.
            withFrameNanos {}
            requesters[focused.day - 1].requestFocus()
        }
        // A day's side, which the seven columns share on a narrow screen.
        val cell = minOf(sizes.calendarDay, maxWidth / 7)
        Column(Modifier.width(cell * 7), verticalArrangement = Arrangement.spacedBy(Space.s2)) {
            // As the web libraries lay it out: the month between the buttons that change it.
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    // The chevrons point the way the months run, which is mirrored right to left.
                    icon = if (rtl) IconName.ChevronRight else IconName.ChevronLeft,
                    label = previousLabel,
                    onClick = { show(CalendarKey.PageUp) },
                    size = ControlSize.Sm,
                    enabled = hasMonthBefore(month, min),
                )
                BasicText(
                    locale.monthTitle(month),
                    modifier = Modifier
                        .weight(1f)
                        .semantics {
                            heading()
                            // Said when it changes, so a screen reader hears which month is shown.
                            liveRegion = LiveRegionMode.Polite
                        },
                    style = Typography.bodyStrong
                        .resolved(colors.datePickerHeading)
                        .copy(textAlign = TextAlign.Center),
                    maxLines = 1,
                )
                IconButton(
                    icon = if (rtl) IconName.ChevronLeft else IconName.ChevronRight,
                    label = nextLabel,
                    onClick = { show(CalendarKey.PageDown) },
                    size = ControlSize.Sm,
                    enabled = hasMonthAfter(month, max),
                )
            }
            Column {
                // Every day's name says its weekday, so a screen reader skips the initials.
                Row(Modifier.clearAndSetSemantics {}) {
                    for (column in 0 until 7) {
                        val weekday = DayOfWeek((locale.firstDayOfWeek.isoDayNumber - 1 + column) % 7 + 1)
                        BasicText(
                            locale.weekdayInitial(weekday),
                            Modifier.width(cell).padding(vertical = Space.s1),
                            style = Typography.footnote
                                .resolved(colors.datePickerWeekday)
                                .copy(textAlign = TextAlign.Center),
                            maxLines = 1,
                        )
                    }
                }
                Column(
                    Modifier
                        .onFocusChanged { hasFocus = it.hasFocus }
                        .onPreviewKeyEvent { event ->
                            if (event.isChoice()) {
                                // Both halves of the press, so that the key coming up does not
                                // press what has the focus once the calendar is gone.
                                if (event.type == KeyEventType.KeyDown) onChoose(focused)
                                return@onPreviewKeyEvent true
                            }
                            val key = calendarKey(event, rtl) ?: return@onPreviewKeyEvent false
                            if (event.type == KeyEventType.KeyDown) {
                                showFocus = true
                                focused = moveFocus(focused, key, min, max)
                                focusRequests++
                            }
                            true
                        }
                        .semantics { collectionInfo = CollectionInfo(rowCount = weeks.size, columnCount = 7) },
                ) {
                    weeks.forEachIndexed { row, week ->
                        Row {
                            week.forEachIndexed { column, day ->
                                if (day == null) {
                                    Box(Modifier.size(cell, sizes.calendarDay))
                                } else {
                                    Day(
                                        day = day,
                                        name = locale.longDate(day, today = day == today),
                                        width = cell,
                                        selected = day == value,
                                        today = day == today,
                                        choosable = inRange(day, min, max),
                                        tabStop = day == focused,
                                        showFocus = showFocus,
                                        requester = requesters[day.day - 1],
                                        position = CollectionItemInfo(row, rowSpan = 1, column, columnSpan = 1),
                                        onClick = { onChoose(day) },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * A day of the calendar: its number on a circle that marks it chosen, today, under the pointer
 * or focused.
 *
 * @param name The day in full, for a screen reader.
 * @param choosable False for a day outside the range, which is shown and cannot be chosen.
 * @param tabStop Whether the focus may rest here: on one day only, the one the keys move.
 * @param showFocus Whether a focused day shows it, which it does once the keyboard is in use.
 */
@Composable
private fun Day(
    day: LocalDate,
    name: String,
    width: Dp,
    selected: Boolean,
    today: Boolean,
    choosable: Boolean,
    tabStop: Boolean,
    showFocus: Boolean,
    requester: FocusRequester,
    position: CollectionItemInfo,
    onClick: () -> Unit,
) {
    val colors = LocalColors.current
    val height = LocalSizes.current.calendarDay
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val focused by interactions.collectIsFocusedAsState()
    val ring = focused && showFocus
    // The keyboard moves the same highlight as the pointer, with the focus ring around it.
    val highlighted = hovered || ring
    val fill = when {
        !choosable -> Color.Transparent
        selected && pressed -> colors.datePickerSelectedBackgroundPressed
        selected && highlighted -> colors.datePickerSelectedBackgroundHover
        selected -> colors.datePickerSelectedBackground
        pressed -> colors.datePickerDayBackgroundPressed
        highlighted -> colors.datePickerDayBackgroundHover
        else -> Color.Transparent
    }
    val text = when {
        !choosable -> colors.datePickerDisabledText
        selected -> colors.datePickerSelectedText
        today -> colors.datePickerTodayText
        else -> colors.datePickerDayText
    }
    // Today is bolder as well as ringed, so that it is not told by color alone.
    val style = if (today) Typography.bodyStrong else Typography.body
    val circle = minOf(width, height) - Space.s0_5 * 2

    Box(
        Modifier
            .size(width, height)
            .focusRequester(requester)
            .focusProperties { canFocus = tabStop }
            .clickable(
                interactionSource = interactions,
                // No ripple or overlay: the pressed and hover colors are tokens.
                indication = null,
                enabled = choosable,
                role = Role.Button,
                onClick = onClick,
            )
            // Inside the press handling, so that the day is said by its full name, not its number.
            .clearAndSetSemantics {
                contentDescription = name
                if (selected) this.selected = true
                collectionItemInfo = position
            },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .size(circle)
                .focusRingAround(ring, colors.borderFocus)
                .background(fill, CircleShape)
                .then(
                    if (today && !selected) {
                        Modifier.border(Border.widthThin, colors.datePickerTodayBorder, CircleShape)
                    } else {
                        Modifier
                    },
                ),
            contentAlignment = Alignment.Center,
        ) {
            BasicText(day.day.toString(), style = style.resolved(text), maxLines = 1)
        }
    }
}

/**
 * The focus ring of [focusRing], drawn while [visible] says so rather than whenever the focus
 * arrives: a calendar opened by a press puts the focus on a day without showing it.
 */
private fun Modifier.focusRingAround(visible: Boolean, color: Color): Modifier = drawWithContent {
    drawContent()
    if (!visible) return@drawWithContent
    val width = Focus.width.toPx()
    // The gap keeps the ring from blending into the day's own fill.
    val outset = Focus.offset.toPx() + width / 2
    drawCircle(color, radius = size.minDimension / 2 + outset, style = Stroke(width))
}

/** Enter or Space, which open the field and choose a day. */
private fun KeyEvent.isChoice(): Boolean = key == Key.Enter || key == Key.NumPadEnter || key == Key.Spacebar

/** The calendar key [event] is, if any. Left and Right swap in a right-to-left layout. */
private fun calendarKey(event: KeyEvent, rtl: Boolean): CalendarKey? = when (event.key) {
    Key.DirectionLeft -> if (rtl) CalendarKey.Right else CalendarKey.Left
    Key.DirectionRight -> if (rtl) CalendarKey.Left else CalendarKey.Right
    Key.DirectionUp -> CalendarKey.Up
    Key.DirectionDown -> CalendarKey.Down
    Key.PageUp -> if (event.isShiftPressed) CalendarKey.ShiftPageUp else CalendarKey.PageUp
    Key.PageDown -> if (event.isShiftPressed) CalendarKey.ShiftPageDown else CalendarKey.PageDown
    Key.MoveHome -> CalendarKey.Home
    Key.MoveEnd -> CalendarKey.End
    else -> null
}

/** A key that moves the focused day of a calendar, as it reads in a left-to-right layout. */
internal enum class CalendarKey { Left, Right, Up, Down, PageUp, PageDown, ShiftPageUp, ShiftPageDown, Home, End }

/**
 * The weeks of [month], each of seven days from [firstDayOfWeek]. Days of the months before and
 * after are not shown, so they are null.
 */
internal fun monthWeeks(month: YearMonth, firstDayOfWeek: DayOfWeek): List<List<LocalDate?>> {
    val before = (month.firstDay.dayOfWeek.isoDayNumber - firstDayOfWeek.isoDayNumber + 7) % 7
    val days = List(before) { null } + List(month.numberOfDays) { LocalDate(month.year, month.month, it + 1) }
    return days.chunked(7) { week -> week + List(7 - week.size) { null } }
}

/**
 * The day [key] moves the focus to from [day], held between [min] and [max]. A month or a year
 * on keeps the day of the month, or the month's last day where it is shorter, so January 31 goes
 * to the last day of February.
 */
internal fun moveFocus(day: LocalDate, key: CalendarKey, min: LocalDate?, max: LocalDate?): LocalDate {
    val moved = when (key) {
        CalendarKey.Left -> day.minus(1, DateTimeUnit.DAY)
        CalendarKey.Right -> day.plus(1, DateTimeUnit.DAY)
        CalendarKey.Up -> day.minus(1, DateTimeUnit.WEEK)
        CalendarKey.Down -> day.plus(1, DateTimeUnit.WEEK)
        CalendarKey.PageUp -> day.minus(1, DateTimeUnit.MONTH)
        CalendarKey.PageDown -> day.plus(1, DateTimeUnit.MONTH)
        CalendarKey.ShiftPageUp -> day.minus(1, DateTimeUnit.YEAR)
        CalendarKey.ShiftPageDown -> day.plus(1, DateTimeUnit.YEAR)
        CalendarKey.Home -> day.yearMonth.firstDay
        CalendarKey.End -> day.yearMonth.lastDay
    }
    return clamp(moved, min, max)
}

/** Whether the month before [month] has a day on or after [min], so its button is enabled. */
internal fun hasMonthBefore(month: YearMonth, min: LocalDate?): Boolean = min == null || min.yearMonth < month

/** Whether the month after [month] has a day on or before [max], so its button is enabled. */
internal fun hasMonthAfter(month: YearMonth, max: LocalDate?): Boolean = max == null || max.yearMonth > month

/**
 * Whether the focus goes to the focused day once a month button has shown [shown]. The button
 * keeps it, so that it can be pressed again, but for two cases: the focus was on a day, whose
 * cell goes away with its month; or the press disabled the button, on reaching the month of
 * [min] or [max], and a disabled button drops the focus, which would then leave the calendar.
 */
internal fun dayTakesFocus(
    wasOnDay: Boolean,
    key: CalendarKey,
    shown: YearMonth,
    min: LocalDate?,
    max: LocalDate?,
): Boolean = wasOnDay || when (key) {
    CalendarKey.PageUp -> !hasMonthBefore(shown, min)
    CalendarKey.PageDown -> !hasMonthAfter(shown, max)
    else -> false
}

/** [day], or the nearer of [min] and [max] when it is outside them. */
internal fun clamp(day: LocalDate, min: LocalDate?, max: LocalDate?): LocalDate = when {
    min != null && day < min -> min
    max != null && day > max -> max
    else -> day
}

/** Whether [day] is between [min] and [max], which may each be missing. */
internal fun inRange(day: LocalDate, min: LocalDate?, max: LocalDate?): Boolean =
    (min == null || day >= min) && (max == null || day <= max)

/**
 * The day that has the focus when the calendar opens, whose month it shows: the chosen day, or
 * today while none is chosen, held between [min] and [max].
 */
internal fun openingDay(value: LocalDate?, today: LocalDate, min: LocalDate?, max: LocalDate?): LocalDate =
    clamp(value ?: today, min, max)
