// What differs per platform. Everything else in this package is common code.

package acme.ui

import acme.tokens.Input
import androidx.compose.runtime.Composable
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth

/** The platform's input device: pointer on the desktop, touch on Android and iOS. */
expect val platformInput: Input

/** Whether the system is set to reduce motion. False where the platform has no such setting to read. */
@Composable
internal expect fun systemReducedMotion(): Boolean

/**
 * A layer over the whole window, above everything else in it, for what interrupts the screen: a
 * sheet or a dialog, with its scrim. It takes the focus and every press while it is there. Back
 * and Escape call [onDismiss]. The layer draws nothing itself: the content fills it.
 */
@Composable
internal expect fun WindowLayer(onDismiss: () -> Unit, content: @Composable () -> Unit)

/**
 * The names and the week of the locale the app runs in, for a [DatePicker] and a
 * [DateRangePicker]. Each platform has
 * them from its own locale data, so they read as the platform's own calendars do.
 */
internal interface CalendarLocale {
    /** The day each week of the calendar starts on: Sunday in the United States, Monday in most of Europe. */
    val firstDayOfWeek: DayOfWeek

    /** The heading of a month: "March 2026", "2026년 3월". */
    fun monthTitle(month: YearMonth): String

    /** The heading of a weekday's column: "T", "화". */
    fun weekdayInitial(day: DayOfWeek): String

    /** A day as the field shows it: "Mar 10, 2026", "2026. 3. 10.". */
    fun mediumDate(date: LocalDate): String

    /**
     * A day in full, for a screen reader: "Tuesday, March 10, 2026". With [today], the
     * platform's word for today comes first where it has one.
     */
    fun longDate(date: LocalDate, today: Boolean): String

    /**
     * A range of days as a [DateRangePicker]'s field shows it, in the medium form: "Mar 10 – 14,
     * 2026" where the platform formats an interval and leaves out what the two days share.
     */
    fun formatRange(start: LocalDate, end: LocalDate): String
}

internal expect fun calendarLocale(): CalendarLocale
