package acme.ui

import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.remember
import android.provider.Settings
import acme.tokens.Sizes
import acme.tokens.TouchSizes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import android.icu.text.DateFormat
import android.icu.text.DateFormatSymbols
import android.icu.util.Calendar
import android.icu.util.GregorianCalendar
import android.text.format.DateUtils
import java.util.Date
import java.util.Locale
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.number

/** A phone or tablet is used with fingers. */
actual val platformSizes: Sizes = TouchSizes

// Android has no "reduce motion" switch of its own: "Remove animations" sets this scale to 0.
@Composable
internal actual fun systemReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return remember(resolver) {
        Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
}

@Composable
internal actual fun WindowLayer(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // What is shown draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false,
            // The scrim covers the system bars; what is shown pads itself.
            decorFitsSystemWindows = false,
        ),
    ) {
        // Android dims the screen behind a dialog on its own, which would darken the scrim twice.
        val window = (LocalView.current.parent as? DialogWindowProvider)?.window
        SideEffect { window?.setDimAmount(0f) }
        content()
    }
}

// ICU rather than java.time, which has no pattern for a month and a year ("yMMMM") before
// Java 19. ICU is the system's own locale data, from API 24.
internal actual fun calendarLocale(): CalendarLocale = IcuCalendarLocale(Locale.getDefault())

private class IcuCalendarLocale(private val locale: Locale) : CalendarLocale {
    override val firstDayOfWeek: DayOfWeek = isoDay(Calendar.getInstance(locale).firstDayOfWeek)
    private val month = DateFormat.getInstanceForSkeleton("yMMMM", locale)
    private val medium = DateFormat.getDateInstance(DateFormat.MEDIUM, locale)
    private val full = DateFormat.getDateInstance(DateFormat.FULL, locale)
    // Counted from Sunday, at 1.
    private val initials = DateFormatSymbols.getInstance(locale)
        .getWeekdays(DateFormatSymbols.STANDALONE, DateFormatSymbols.NARROW)

    override fun monthTitle(month: YearMonth): String = this.month.format(at(month.year, month.month.number, 1))

    override fun weekdayInitial(day: DayOfWeek): String = initials[day.isoDayNumber % 7 + 1]

    override fun mediumDate(date: LocalDate): String = medium.format(at(date))

    override fun longDate(date: LocalDate, today: Boolean): String {
        val name = full.format(at(date))
        if (!today) return name
        // "Today" in the system's language, as the system's own lists say it.
        val now = System.currentTimeMillis()
        return "${DateUtils.getRelativeTimeSpanString(now, now, DateUtils.DAY_IN_MILLIS)}, $name"
    }

    private fun at(date: LocalDate): Date = at(date.year, date.month.number, date.day)

    // At noon, so that no change of the clock moves the moment into another day.
    private fun at(year: Int, month: Int, day: Int): Date = GregorianCalendar(year, month - 1, day, 12, 0).time
}

/** The ISO weekday of a [Calendar] weekday, which counts from Sunday at 1. */
private fun isoDay(day: Int): DayOfWeek = DayOfWeek(if (day == Calendar.SUNDAY) 7 else day - 1)
