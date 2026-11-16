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
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.semantics.disabled
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
    val locale = remember { calendarLocale() }
    CalendarField(
        label, value?.let(locale::mediumDate), placeholder, description, error, enabled, initiallyOpen, modifier,
    ) { open, byKeyboard, close ->
        val calendar = @Composable { calendarModifier: Modifier ->
            Calendar(
                chosen = value,
                min = min,
                max = max,
                locale = locale,
                previousLabel = previousLabel,
                nextLabel = nextLabel,
                byKeyboard = byKeyboard,
                marks = { DayMarks.chosen(it == value) },
                onChoose = { day, _ ->
                    onValueChange(day)
                    close()
                    null
                },
                modifier = calendarModifier,
            )
        }
        // The form goes with the sizes, as a Select's list does.
        if (LocalSizes.current.forPointer) {
            if (open) CalendarPopup(label, onClose = close) { calendar(Modifier) }
        } else {
            BottomSheet(open = open, onDismiss = close, title = label) { calendar(Modifier.fillMaxWidth()) }
        }
    }
}

/**
 * What DatePicker and DateRangePicker share: the label, a box like a [Select]'s that opens the
 * calendar on a press, Enter or Space, and the description or the error under it.
 *
 * @param shown What the box shows, the chosen day or range, or null for the placeholder.
 * @param calendar Draws the calendar while [open][calendar] says so, opened by the keyboard or
 *   not, and calls `close` to close it. The focus goes back to the box once it is closed.
 */
@Composable
internal fun CalendarField(
    label: String,
    shown: String?,
    placeholder: String?,
    description: String?,
    error: String?,
    enabled: Boolean,
    initiallyOpen: Boolean,
    modifier: Modifier,
    calendar: @Composable (open: Boolean, byKeyboard: Boolean, close: () -> Unit) -> Unit,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
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
    val interactions = remember { MutableInteractionSource() }
    val focused by interactions.collectIsFocusedAsState()
    val textColor = when {
        shown == null -> colors.fieldPlaceholder
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
                        if (shown != null) stateDescription = shown
                        // A screen reader calls the field collapsed or expanded.
                        if (open) collapse { close(); true } else expand { open = true; true }
                        if (error != null) error(error)
                    }
                    .padding(horizontal = Space.s3),
                horizontalArrangement = Arrangement.spacedBy(Space.s2),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(
                    text = shown ?: placeholder.orEmpty(),
                    modifier = Modifier.weight(1f),
                    style = Typography.body.resolved(textColor),
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 1,
                )
                Icon(IconName.Calendar, size = IconSize.Sm, color = colors.fieldPlaceholder)
            }
            calendar(open, byKeyboard, close)
        }
        FieldHelp(error, description)
    }
}

/** The calendar on the menu's surface, under the field, lined up with its start. */
@Composable
internal fun CalendarPopup(label: String, onClose: () -> Unit, content: @Composable () -> Unit) {
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
 * One month or more side by side, each with its heading, with buttons for the months before and
 * after them at the ends. The focus moves over the days with the keys; only the focused day takes
 * Tab, so Tab goes from it to the two buttons and back. DatePicker shows one month and
 * DateRangePicker one or two, each drawing its days with [marks].
 *
 * @param chosen The day the calendar opens on, held between [min] and [max]: today without one.
 * @param byKeyboard Shows the focused day from the start, not only once a key is used.
 * @param count How many months are shown side by side. The month buttons move by as many.
 * @param marks How each day is drawn: chosen, an end of a range, in its band.
 * @param choosable Whether a press on a day between [min] and [max] does anything. The keys
 *   still move over a day that cannot be chosen.
 * @param dayName A day's name for a screen reader, from its marks and its name in full.
 * @param onPoint The day with the keyboard's focus, after a key moved it there.
 * @param onChoose A press or Enter on a day. Returns the day the focus goes on to while the
 *   calendar stays open, or null where it stays where it is.
 */
@Composable
internal fun Calendar(
    chosen: LocalDate?,
    min: LocalDate?,
    max: LocalDate?,
    locale: CalendarLocale,
    previousLabel: String,
    nextLabel: String,
    byKeyboard: Boolean,
    marks: (LocalDate) -> DayMarks,
    onChoose: (day: LocalDate, byKeyboard: Boolean) -> LocalDate?,
    modifier: Modifier,
    count: Int = 1,
    choosable: (LocalDate) -> Boolean = { true },
    dayName: (day: LocalDate, marks: DayMarks, name: String) -> String = { _, _, name -> name },
    onPoint: (LocalDate) -> Unit = {},
    onHover: ((day: LocalDate, hovered: Boolean) -> Unit)? = null,
) {
    val colors = LocalColors.current
    val sizes = LocalSizes.current
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val today = remember { Clock.System.todayIn(TimeZone.currentSystemDefault()) }
    // The day that has the focus, or would have it once the calendar has; the months shown hold it.
    var focused by remember { mutableStateOf(openingDay(chosen, today, min, max)) }
    var first by remember { mutableStateOf(focused.yearMonth) }
    var showFocus by remember { mutableStateOf(byKeyboard) }
    // Each increase puts the input focus on `focused`, once its cell is there. The first does so
    // as the calendar opens.
    var focusRequests by remember { mutableIntStateOf(1) }
    // The month whose grid holds the focus, if one does.
    var focusedGrid by remember { mutableStateOf<YearMonth?>(null) }
    val months = visibleMonths(first, count)
    val requesters = remember(months) { months.associateWith { month -> List(month.numberOfDays) { FocusRequester() } } }

    fun moveTo(day: LocalDate) {
        focused = day
        first = keepInView(first, day, count)
    }

    // The buttons show the months before or after the ones shown, and the focused day goes along.
    fun page(direction: Int) {
        val wasOnDay = focusedGrid != null
        val months = direction * count
        val to = clamp(focused.plus(months, DateTimeUnit.MONTH), min, max)
        first = keepInView(first.plus(months, DateTimeUnit.MONTH), to, count)
        focused = to
        val (key, edge) = if (direction < 0) CalendarKey.PageUp to first else CalendarKey.PageDown to first.plus(count - 1, DateTimeUnit.MONTH)
        if (dayTakesFocus(wasOnDay, key, edge, min, max)) focusRequests++
    }

    fun choose(day: LocalDate, byKey: Boolean) {
        val next = onChoose(day, byKey) ?: return
        moveTo(next)
        focusRequests++
        if (byKey) onPoint(next)
    }

    BoxWithConstraints(modifier, contentAlignment = Alignment.TopCenter) {
        // In here rather than outside: what this box holds is composed only once its width is
        // known, and the days have to be there before the focus can go to one of them.
        LaunchedEffect(focusRequests) {
            // A frame later as well: a popup takes the focus for itself as it appears, which
            // would undo a request made before.
            withFrameNanos {}
            requesters[focused.yearMonth]?.get(focused.day - 1)?.requestFocus()
        }
        // A day's side, which the seven columns share on a narrow screen.
        val cell = minOf(sizes.calendarDay, (maxWidth - Space.s4 * (count - 1)) / (7 * count))
        Row(horizontalArrangement = Arrangement.spacedBy(Space.s4)) {
            months.forEachIndexed { index, month ->
                Column(Modifier.width(cell * 7), verticalArrangement = Arrangement.spacedBy(Space.s2)) {
                    // As the web libraries lay it out: the months between the buttons that change them.
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (index == 0) {
                            IconButton(
                                // The chevrons point the way the months run, which is mirrored right to left.
                                icon = if (rtl) IconName.ChevronRight else IconName.ChevronLeft,
                                label = previousLabel,
                                onClick = { page(-1) },
                                size = ControlSize.Sm,
                                enabled = hasMonthBefore(month, min),
                            )
                        } else {
                            Spacer(Modifier.size(sizes.controlSm))
                        }
                        MonthHeading(locale.monthTitle(month), Modifier.weight(1f))
                        if (index == months.lastIndex) {
                            IconButton(
                                icon = if (rtl) IconName.ChevronLeft else IconName.ChevronRight,
                                label = nextLabel,
                                onClick = { page(1) },
                                size = ControlSize.Sm,
                                enabled = hasMonthAfter(month, max),
                            )
                        } else {
                            Spacer(Modifier.size(sizes.controlSm))
                        }
                    }
                    Column {
                        WeekdayInitials(locale, cell)
                        MonthDays(
                            month = month,
                            cell = cell,
                            locale = locale,
                            today = today,
                            min = min,
                            max = max,
                            marks = marks,
                            choosable = choosable,
                            dayName = dayName,
                            tabStop = { it == focused },
                            showFocus = showFocus,
                            requesters = requesters[month],
                            onPress = { choose(it, byKey = false) },
                            onHover = onHover,
                            modifier = Modifier
                                .onFocusChanged {
                                    if (it.hasFocus) focusedGrid = month else if (focusedGrid == month) focusedGrid = null
                                }
                                .onPreviewKeyEvent { event ->
                                    if (event.isChoice()) {
                                        // Both halves of the press, so that the key coming up does not
                                        // press what has the focus once the calendar is gone.
                                        if (event.type == KeyEventType.KeyDown) choose(focused, byKey = true)
                                        return@onPreviewKeyEvent true
                                    }
                                    val key = calendarKey(event, rtl) ?: return@onPreviewKeyEvent false
                                    if (event.type == KeyEventType.KeyDown) {
                                        showFocus = true
                                        moveTo(moveFocus(focused, key, min, max))
                                        focusRequests++
                                        onPoint(focused)
                                    }
                                    true
                                },
                        )
                    }
                }
            }
        }
    }
}

/** A month's name over its days, said by a screen reader when it changes. */
@Composable
internal fun MonthHeading(title: String, modifier: Modifier = Modifier) {
    BasicText(
        title,
        modifier = modifier.semantics {
            heading()
            // Said when it changes, so a screen reader hears which month is shown.
            liveRegion = LiveRegionMode.Polite
        },
        style = Typography.bodyStrong
            .resolved(LocalColors.current.datePickerHeading)
            .copy(textAlign = TextAlign.Center),
        maxLines = 1,
    )
}

/** The initials of the days of the week over the columns of a month, each [cell] wide. */
@Composable
internal fun WeekdayInitials(locale: CalendarLocale, cell: Dp, modifier: Modifier = Modifier) {
    val colors = LocalColors.current
    // Every day's name says its weekday, so a screen reader skips the initials.
    Row(modifier.clearAndSetSemantics {}) {
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
}

/**
 * The days of [month] in rows of a week, [cell] wide each, as a grid for a screen reader. Both
 * pickers draw their days with it, in the popup's months and in the touch sheet's list.
 *
 * @param tabStop Whether the focus may rest on a day: on one only, the one the keys move.
 * @param requesters One for each day of the month, to put the focus on it.
 */
@Composable
internal fun MonthDays(
    month: YearMonth,
    cell: Dp,
    locale: CalendarLocale,
    today: LocalDate,
    min: LocalDate?,
    max: LocalDate?,
    marks: (LocalDate) -> DayMarks,
    choosable: (LocalDate) -> Boolean,
    dayName: (day: LocalDate, marks: DayMarks, name: String) -> String,
    tabStop: (LocalDate) -> Boolean,
    showFocus: Boolean,
    requesters: List<FocusRequester>?,
    onPress: (LocalDate) -> Unit,
    onHover: ((day: LocalDate, hovered: Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val sizes = LocalSizes.current
    val weeks = remember(month, locale) { monthWeeks(month, locale.firstDayOfWeek) }
    Column(modifier.semantics { collectionInfo = CollectionInfo(rowCount = weeks.size, columnCount = 7) }) {
        weeks.forEachIndexed { row, week ->
            Row {
                week.forEachIndexed { column, day ->
                    if (day == null) {
                        Box(Modifier.size(cell, sizes.calendarDay))
                    } else {
                        val dayMarks = marks(day)
                        val reachable = inRange(day, min, max)
                        Day(
                            day = day,
                            name = dayName(day, dayMarks, locale.longDate(day, today = day == today)),
                            width = cell,
                            marks = dayMarks,
                            today = day == today,
                            reachable = reachable,
                            choosable = reachable && choosable(day),
                            tabStop = tabStop(day),
                            showFocus = showFocus,
                            requester = requesters?.get(day.day - 1),
                            position = CollectionItemInfo(row, rowSpan = 1, column, columnSpan = 1),
                            onClick = { onPress(day) },
                            onHover = onHover?.let { hover -> { hovered: Boolean -> hover(day, hovered) } },
                        )
                    }
                }
            }
        }
    }
}

/**
 * A day of the calendar: its number on a circle that marks it chosen, today, under the pointer
 * or focused, over its piece of a range's band.
 *
 * @param name The day in full, for a screen reader.
 * @param reachable False for a day outside the range, which is shown and cannot be chosen.
 * @param choosable False also for a day a range's length does not allow as its end, over which
 *   the keys still move.
 * @param tabStop Whether the focus may rest here: on one day only, the one the keys move.
 * @param showFocus Whether a focused day shows it, which it does once the keyboard is in use.
 */
@Composable
private fun Day(
    day: LocalDate,
    name: String,
    width: Dp,
    marks: DayMarks,
    today: Boolean,
    reachable: Boolean,
    choosable: Boolean,
    tabStop: Boolean,
    showFocus: Boolean,
    requester: FocusRequester?,
    position: CollectionItemInfo,
    onClick: () -> Unit,
    onHover: ((Boolean) -> Unit)?,
) {
    val colors = LocalColors.current
    val height = LocalSizes.current.calendarDay
    val interactions = remember { MutableInteractionSource() }
    val hovered by interactions.collectIsHoveredAsState()
    val pressed by interactions.collectIsPressedAsState()
    val focused by interactions.collectIsFocusedAsState()
    if (onHover != null) LaunchedEffect(hovered) { onHover(hovered) }
    val ring = focused && showFocus
    // The keyboard moves the same highlight as the pointer, with the focus ring around it.
    val highlighted = (hovered || ring) && choosable
    val pushed = pressed && choosable
    // A range's start stays a filled circle while it waits for its end, though pressing it again
    // does nothing when the range has to be longer.
    val end = (marks.start || marks.end) && reachable
    val inBand = marks.band != null && !end && choosable
    val fill = when {
        end && pushed -> colors.datePickerSelectedBackgroundPressed
        end && highlighted -> colors.datePickerSelectedBackgroundHover
        end -> colors.datePickerSelectedBackground
        inBand && pushed -> colors.datePickerRangeBackgroundPressed
        inBand && highlighted -> colors.datePickerRangeBackgroundHover
        pushed -> colors.datePickerDayBackgroundPressed
        highlighted -> colors.datePickerDayBackgroundHover
        else -> Color.Transparent
    }
    val text = when {
        end -> colors.datePickerSelectedText
        !choosable -> colors.datePickerDisabledText
        today -> colors.datePickerTodayText
        inBand -> colors.datePickerRangeText
        else -> colors.datePickerDayText
    }
    // Today is bolder as well as ringed, so that it is not told by color alone.
    val style = if (today) Typography.bodyStrong else Typography.body
    val circle = minOf(width, height) - Space.s0_5 * 2

    Box(
        Modifier
            .size(width, height)
            .then(if (requester != null) Modifier.focusRequester(requester) else Modifier)
            .focusProperties { canFocus = tabStop && reachable }
            .clickable(
                interactionSource = interactions,
                // No ripple or overlay: the pressed and hover colors are tokens.
                indication = null,
                enabled = reachable,
                role = Role.Button,
                onClick = { if (choosable) onClick() },
            )
            // Inside the press handling, so that the day is said by its full name, not its number.
            .clearAndSetSemantics {
                contentDescription = name
                if (marks.selected) this.selected = true
                collectionItemInfo = position
                if (!choosable) disabled()
            },
        contentAlignment = Alignment.Center,
    ) {
        marks.band?.let { band -> BandPiece(band, height = minOf(width, height), color = colors.datePickerRangeBackground) }
        Box(
            Modifier
                .size(circle)
                .focusRingAround(ring, colors.borderFocus)
                .background(fill, CircleShape)
                .then(
                    if (today && !end) {
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
 * A day's piece of a range's band: from its middle where an end's circle lies on it, to the
 * cell's edge, square where the band goes on and rounded where a week's row ends it.
 */
@Composable
private fun BoxScope.BandPiece(band: Band, height: Dp, color: Color) {
    val leading = if (band.leading == BandEdge.Round) 50 else 0
    val trailing = if (band.trailing == BandEdge.Round) 50 else 0
    val shape = RoundedCornerShape(
        topStartPercent = leading,
        topEndPercent = trailing,
        bottomEndPercent = trailing,
        bottomStartPercent = leading,
    )
    val (alignment, share) = when {
        band.leading == BandEdge.Middle -> Alignment.CenterEnd to 0.5f
        band.trailing == BandEdge.Middle -> Alignment.CenterStart to 0.5f
        else -> Alignment.Center to 1f
    }
    Box(
        Modifier
            .align(alignment)
            .fillMaxWidth(share)
            .height(height)
            .background(color, shape),
    )
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
