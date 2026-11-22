package acme.ui

import acme.tokens.Input
import acme.tokens.Space
import acme.tokens.Typography
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.time.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.YearMonth
import kotlinx.datetime.daysUntil
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.minus
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn
import kotlinx.datetime.yearMonth

/** A range of days, from [start] to [end], both included. With the same day at both ends it is one day long. */
data class DateRange(val start: LocalDate, val end: LocalDate) {
    init {
        require(start <= end) { "A range ends on or after its start." }
    }
}

/**
 * A field for choosing a range of days, a start and an end, as for a stay or a trip. Closed, it
 * looks like a [DatePicker] and shows both days. Pressing it opens the calendar on the start, or
 * on today while nothing is chosen: with a pointer a popup under the field of two months side by
 * side, or one where the window is narrower than 640 dp; on touch a tall [BottomSheet] titled
 * with `label`, with the months from `min` to `max` scrolling down and a Done button.
 *
 * The first day pressed starts the range and the second ends it if the length allows, which calls
 * `onValueChange` once. The popup then closes; the sheet stays, showing the range, until Done, a
 * drag down, a tap outside or Back. A day before the start starts again from there, and days the
 * length does not allow as the end cannot be pressed. With a pointer or the keys, the band runs
 * from the start to the day under the pointer or with the focus until the end is pressed. Closing
 * without an end drops the start. The keys are [DatePicker]'s; Enter on the start moves the focus
 * to the next day.
 *
 * @param label Always visible, above the field. A screen reader names the field with it.
 * @param value The chosen range, or null while none is chosen.
 * @param min The first day that can be chosen. Days before it are shown and cannot be chosen.
 * @param max The last day that can be chosen.
 * @param minLength The fewest days the end can be after the start: 1 for a stay of at least one
 *   night. With 0 the start can be the end too.
 * @param maxLength The most days the end can be after the start, or null for no limit.
 * @param placeholder Shown in the field while nothing is chosen.
 * @param description Help shown under the field. Replaced by `error` while there is one.
 * @param error What is wrong and how to fix it. Clear it when the value changes.
 * @param startLabel Names the first day, over the months and for a screen reader: "Check-in".
 * @param endLabel Names the last day: "Check-out".
 * @param previousLabel Names the button that shows the months before, for a screen reader.
 * @param nextLabel Names the button that shows the months after.
 * @param doneLabel Names the button at the bottom of the touch sheet that closes it.
 */
@Composable
fun DateRangePicker(
    label: String,
    value: DateRange?,
    onValueChange: (DateRange) -> Unit,
    modifier: Modifier = Modifier,
    min: LocalDate? = null,
    max: LocalDate? = null,
    minLength: Int = 0,
    maxLength: Int? = null,
    placeholder: String? = null,
    description: String? = null,
    error: String? = null,
    enabled: Boolean = true,
    startLabel: String = "Start",
    endLabel: String = "End",
    previousLabel: String = "Previous month",
    nextLabel: String = "Next month",
    doneLabel: String = "Done",
) {
    DateRangePicker(
        label, value, onValueChange, modifier, min, max, minLength, maxLength, placeholder, description, error,
        enabled, startLabel, endLabel, previousLabel, nextLabel, doneLabel, initiallyOpen = false,
    )
}

/** @param initiallyOpen Starts with the calendar open, for drawing it into an image. */
@Composable
internal fun DateRangePicker(
    label: String,
    value: DateRange?,
    onValueChange: (DateRange) -> Unit,
    modifier: Modifier,
    min: LocalDate?,
    max: LocalDate?,
    minLength: Int,
    maxLength: Int?,
    placeholder: String?,
    description: String?,
    error: String?,
    enabled: Boolean,
    startLabel: String,
    endLabel: String,
    previousLabel: String,
    nextLabel: String,
    doneLabel: String,
    initiallyOpen: Boolean,
) {
    val locale = remember { calendarLocale() }
    val shown = value?.let { locale.formatRange(it.start, it.end) }
    CalendarField(label, shown, placeholder, description, error, enabled, initiallyOpen, modifier) { open, byKeyboard, close ->
        val labels = RangeLabels(startLabel, endLabel, previousLabel, nextLabel)
        if (LocalInput.current == Input.Pointer) {
            // Counted as the calendar opens, so that resizing the window does not rearrange it.
            val window = LocalWindowInfo.current
            val density = LocalDensity.current
            val count = remember(open) { monthsForWidth(with(density) { window.containerSize.width.toDp() }) }
            // As wide as the months, so that the ends over them do not stretch the popup.
            val sizes = LocalSizes.current
            val width = sizes.calendarDay * 7 * count + Space.s4 * (count - 1)
            if (open) {
                CalendarPopup(label, onClose = close) {
                    RangeCalendar(
                        value, onValueChange, min, max, minLength, maxLength, locale, labels, Modifier.width(width),
                    ) { choosing ->
                        Calendar(
                            chosen = value?.start,
                            min = min,
                            max = max,
                            locale = locale,
                            previousLabel = previousLabel,
                            nextLabel = nextLabel,
                            byKeyboard = byKeyboard,
                            marks = choosing::marks,
                            onChoose = { day, byKey ->
                                choosing.press(day, byKey, closesOnEnd = true, close = close)
                            },
                            modifier = Modifier,
                            count = count,
                            choosable = choosing::choosable,
                            dayName = choosing::dayName,
                            onPoint = choosing::point,
                            onHover = choosing::hover,
                        )
                    }
                }
            }
        } else {
            BottomSheet(open = open, onDismiss = close, title = label, tall = true) {
                RangeCalendar(value, onValueChange, min, max, minLength, maxLength, locale, labels, Modifier.weight(1f)) { choosing ->
                    MonthList(
                        modifier = Modifier.weight(1f),
                        months = monthsBetween(min, max, choosing.opening.yearMonth),
                        opening = choosing.opening.yearMonth,
                        locale = locale,
                        today = choosing.today,
                        min = min,
                        max = max,
                        choosing = choosing,
                        close = close,
                    )
                }
                Button(doneLabel, onClick = close, variant = ButtonVariant.Primary, size = ControlSize.Md, fullWidth = true)
            }
        }
    }
}

private class RangeLabels(val start: String, val end: String, val previous: String, val next: String)

/**
 * What the calendar shows chosen while it is open, and what a press does to it: a start alone
 * until the end is pressed, then the range given back to the field.
 */
private class RangeChoosing(
    private val value: DateRange?,
    private val onValueChange: (DateRange) -> Unit,
    private val min: LocalDate?,
    private val max: LocalDate?,
    private val minLength: Int,
    private val maxLength: Int?,
    private val labels: RangeLabels,
    private val firstDayOfWeek: DayOfWeek,
    val today: LocalDate,
    draftState: androidx.compose.runtime.MutableState<List<LocalDate>?>,
    pointedState: androidx.compose.runtime.MutableState<LocalDate?>,
) {
    /** A start chosen without its end yet; null while the calendar shows [value]. */
    private var draft by draftState

    /** The day under the pointer or with the keyboard's focus. */
    private var pointed by pointedState

    /** The days the calendar marks chosen: the range, or a start alone. */
    val shown: List<LocalDate> get() = draft ?: value?.let { listOf(it.start, it.end) }.orEmpty()

    /** The day the calendar opens on: the start, or today, held between `min` and `max`. */
    val opening: LocalDate get() = openingDay(value?.start, today, min, max)

    private val preview: LocalDate? get() = pointed?.let { previewEnd(shown, it, minLength, maxLength) }

    fun marks(day: LocalDate): DayMarks = dayMarks(day, shown, preview, firstDayOfWeek)

    fun choosable(day: LocalDate): Boolean = rangeDayChoice(shown, day, minLength, maxLength) != RangeChoice.None

    fun dayName(day: LocalDate, marks: DayMarks, name: String): String = rangeDayName(marks, name, labels.start, labels.end)

    fun point(day: LocalDate) {
        pointed = day
    }

    fun hover(day: LocalDate, hovered: Boolean) {
        if (hovered) pointed = day else if (pointed == day) pointed = null
    }

    /**
     * A press on [day]. The first keeps it as the start, and from the keyboard moves the focus to
     * the next day, which it returns. The second calls `onValueChange` with the range and, where
     * [closesOnEnd], closes the calendar.
     */
    fun press(day: LocalDate, byKeyboard: Boolean, closesOnEnd: Boolean, close: () -> Unit): LocalDate? {
        val shown = shown
        return when (rangeDayChoice(shown, day, minLength, maxLength)) {
            RangeChoice.None -> null
            RangeChoice.Start -> {
                draft = listOf(day)
                pointed = null
                if (byKeyboard) moveFocus(day, CalendarKey.Right, min, max) else day
            }
            RangeChoice.End -> {
                onValueChange(DateRange(shown.first(), day))
                draft = null
                pointed = null
                if (closesOnEnd) close()
                null
            }
        }
    }

    fun summary(locale: CalendarLocale): Pair<String, String> {
        fun named(label: String, day: LocalDate?) = "$label: ${day?.let(locale::mediumDate) ?: "–"}"
        return named(labels.start, shown.getOrNull(0)) to named(labels.end, shown.getOrNull(1))
    }
}

/**
 * The two ends over the months, read out when they change, and [content] under them with what it
 * needs to draw and choose the range. Each opening starts again from [value], since this leaves
 * the composition when the calendar closes.
 */
@Composable
private fun RangeCalendar(
    value: DateRange?,
    onValueChange: (DateRange) -> Unit,
    min: LocalDate?,
    max: LocalDate?,
    minLength: Int,
    maxLength: Int?,
    locale: CalendarLocale,
    labels: RangeLabels,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.(RangeChoosing) -> Unit,
) {
    val today = remember { Clock.System.todayIn(TimeZone.currentSystemDefault()) }
    val draft = remember { mutableStateOf<List<LocalDate>?>(null) }
    val pointed = remember { mutableStateOf<LocalDate?>(null) }
    val choosing = RangeChoosing(
        value, onValueChange, min, max, minLength, maxLength, labels, locale.firstDayOfWeek, today, draft, pointed,
    )
    val colors = LocalColors.current
    val (start, end) = choosing.summary(locale)
    Column(modifier, verticalArrangement = Arrangement.spacedBy(Space.s2)) {
        Row(
            Modifier
                .fillMaxWidth()
                .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            horizontalArrangement = Arrangement.spacedBy(Space.s3, Alignment.Start),
        ) {
            val style = Typography.footnote.resolved(colors.datePickerWeekday)
            BasicText(start, Modifier.weight(1f), style = style, maxLines = 1, overflow = TextOverflow.Ellipsis)
            BasicText(end, style = style, maxLines = 1)
        }
        content(choosing)
    }
}

/**
 * The months of the touch sheet in one list that scrolls down, opened with [opening] at the top,
 * under one row of weekday initials.
 */
@Composable
private fun MonthList(
    modifier: Modifier,
    months: List<YearMonth>,
    opening: YearMonth,
    locale: CalendarLocale,
    today: LocalDate,
    min: LocalDate?,
    max: LocalDate?,
    choosing: RangeChoosing,
    close: () -> Unit,
) {
    val sizes = LocalSizes.current
    val list = rememberLazyListState(initialFirstVisibleItemIndex = months.indexOf(opening).coerceAtLeast(0))
    BoxWithConstraints(modifier.fillMaxWidth(), contentAlignment = Alignment.TopCenter) {
        val cell = minOf(sizes.calendarDay, maxWidth / 7)
        Column(Modifier.width(cell * 7)) {
            WeekdayInitials(locale, cell)
            LazyColumn(Modifier.weight(1f), state = list) {
                items(months, key = { it.toString() }) { month ->
                    Column(Modifier.padding(bottom = Space.s4), verticalArrangement = Arrangement.spacedBy(Space.s2)) {
                        MonthHeading(locale.monthTitle(month), Modifier.fillMaxWidth().padding(top = Space.s2))
                        MonthDays(
                            month = month,
                            cell = cell,
                            locale = locale,
                            today = today,
                            min = min,
                            max = max,
                            marks = choosing::marks,
                            choosable = choosing::choosable,
                            dayName = choosing::dayName,
                            tabStop = { true },
                            showFocus = true,
                            requesters = null,
                            onPress = { choosing.press(it, byKeyboard = false, closesOnEnd = false, close = close) },
                            onHover = null,
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------- what a press does

/** What a press on a day does to the range being chosen. */
internal enum class RangeChoice {
    /** The day starts a new range, and the end is chosen next. */
    Start,

    /** The day ends the range that has its start. */
    End,

    /** Nothing: the length does not allow the day as the end. */
    None,
}

/**
 * What a press on [day] does while the calendar shows [draft]: nothing chosen or a whole range
 * starts a new one; with a start alone, a day before it starts again from there, a day the length
 * allows ends the range, and any other day does nothing. The length counts the days from the start
 * to the end, which are the nights of a stay.
 */
internal fun rangeDayChoice(draft: List<LocalDate>, day: LocalDate, minLength: Int, maxLength: Int?): RangeChoice {
    val start = draft.singleOrNull() ?: return RangeChoice.Start
    val length = start.daysUntil(day)
    return when {
        length < 0 -> RangeChoice.Start
        length < minLength || (maxLength != null && length > maxLength) -> RangeChoice.None
        else -> RangeChoice.End
    }
}

/**
 * The end the range would have if [day] were pressed now, shown while the pointer is over it or
 * the keyboard's focus is on it, or null where the press would not end a range.
 */
internal fun previewEnd(draft: List<LocalDate>, day: LocalDate, minLength: Int, maxLength: Int?): LocalDate? {
    val start = draft.singleOrNull() ?: return null
    return day.takeIf { it > start && rangeDayChoice(draft, it, minLength, maxLength) == RangeChoice.End }
}

/** How one side of a day's piece of the band ends. */
internal enum class BandEdge {
    /** At the middle of the cell, under an end's circle: the band starts or stops there. */
    Middle,

    /**
     * Square at the cell's edge, where the band goes on into the next cell, or stops at the first
     * or last day of a month in the middle of a week.
     */
    Flat,

    /** Rounded at the cell's edge, where a week's row ends the band. */
    Round,
}

/** A day's piece of the band, from its leading side to its trailing side. */
internal data class Band(val leading: BandEdge, val trailing: BandEdge)

/**
 * How a day is drawn in the calendar.
 *
 * @property start The start of the range, or DatePicker's chosen day: a filled circle.
 * @property end The end of the range, or the end the preview would make: a filled circle too.
 * @property band Its piece of the band, between two ends that are not the same day. An end at the
 *   edge of its row has none.
 * @property preview Part of the preview, not of a range that was chosen.
 */
internal data class DayMarks(
    val start: Boolean = false,
    val end: Boolean = false,
    val band: Band? = null,
    val preview: Boolean = false,
) {
    /** Whether a screen reader hears the day selected: every day of the range, and the start alone, but not a preview. */
    val selected: Boolean get() = (start || end || band != null) && !preview

    companion object {
        private val Chosen = DayMarks(start = true, end = true)
        private val Unmarked = DayMarks()

        fun chosen(chosen: Boolean): DayMarks = if (chosen) Chosen else Unmarked
    }
}

/**
 * How [day] is marked while the calendar shows [draft] (a whole range, or a start alone with
 * [preview] as the end it would have). The band runs from the middle of the start to the middle of
 * the end, is rounded where a week's row ends it, and is square where it goes on.
 */
internal fun dayMarks(day: LocalDate, draft: List<LocalDate>, preview: LocalDate?, firstDayOfWeek: DayOfWeek): DayMarks {
    val start = draft.firstOrNull() ?: return DayMarks()
    val (end, previewing) = when {
        draft.size >= 2 -> draft[1] to false
        preview != null && preview > start -> preview to true
        else -> null to false
    }
    val last = end ?: start
    if (day < start || day > last) return DayMarks()
    val column = (day.dayOfWeek.isoDayNumber - firstDayOfWeek.isoDayNumber + 7) % 7
    fun edge(rowEnds: Boolean) = if (rowEnds) BandEdge.Round else BandEdge.Flat
    // An end at the edge of its row has nothing of the band beside it in that row.
    val alone = (day == start && column == 6) || (day == last && column == 0)
    val band = if (start < last && !alone) {
        Band(
            leading = if (day == start) BandEdge.Middle else edge(column == 0),
            trailing = if (day == last) BandEdge.Middle else edge(column == 6),
        )
    } else {
        null
    }
    return DayMarks(start = day == start, end = day == end, band = band, preview = previewing && day > start)
}

/** A day's name for a screen reader: its name in full, after the name of the end it is. */
internal fun rangeDayName(marks: DayMarks, name: String, startLabel: String, endLabel: String): String = buildString {
    if (marks.start) append(startLabel).append(", ")
    if (marks.end && !marks.preview) append(endLabel).append(", ")
    append(name)
}

/** The narrowest window that shows two months side by side; the web libraries switch at the same width. */
private val TwoMonthsFrom = 640.dp

/** How many months the popup shows in a window [width] wide. */
internal fun monthsForWidth(width: Dp): Int = if (width >= TwoMonthsFrom) 2 else 1

/**
 * The months of the touch sheet's list: from the month of [min] to the month of [max]. Without
 * [min] it starts a year before [opening], and without [max] it ends two years after it.
 */
internal fun monthsBetween(min: LocalDate?, max: LocalDate?, opening: YearMonth): List<YearMonth> {
    val first = min?.yearMonth ?: opening.minus(12, DateTimeUnit.MONTH)
    val last = max?.yearMonth ?: opening.plus(24, DateTimeUnit.MONTH)
    return (first..last).toList()
}

/** The [count] months shown side by side from [first]. */
internal fun visibleMonths(first: YearMonth, count: Int): List<YearMonth> =
    List(count.coerceAtLeast(1)) { first.plus(it, DateTimeUnit.MONTH) }

/**
 * The first month shown: [first], unless [day] is outside the [count] months from it, when the
 * view moves as little as it takes to show [day].
 */
internal fun keepInView(first: YearMonth, day: LocalDate, count: Int): YearMonth {
    val month = day.yearMonth
    val behind = count.coerceAtLeast(1) - 1
    return when {
        month < first -> month
        month > first.plus(behind, DateTimeUnit.MONTH) -> month.minus(behind, DateTimeUnit.MONTH)
        else -> first
    }
}
