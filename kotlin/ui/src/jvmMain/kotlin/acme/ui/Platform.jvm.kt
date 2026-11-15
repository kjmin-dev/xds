package acme.ui

import acme.tokens.PointerSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.time.chrono.IsoChronology
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeFormatterBuilder
import java.time.format.FormatStyle
import java.time.format.TextStyle
import java.time.temporal.WeekFields
import java.util.Locale
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.number
import kotlinx.datetime.toJavaLocalDate

/** A desktop is used with a mouse. */
actual val platformSizes: Sizes = PointerSizes

// The JVM has no API for the desktop's reduce-motion setting.
@Composable
internal actual fun systemReducedMotion(): Boolean = false

@OptIn(ExperimentalComposeUiApi::class)
@Composable
internal actual fun WindowLayer(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            // What is shown draws its own scrim from the token and takes the taps on it.
            dismissOnClickOutside = false,
            scrimColor = Color.Transparent,
            usePlatformDefaultWidth = false,
            usePlatformInsets = false,
            // What is shown moves in with the motion tokens, and not at all when less motion
            // is asked for. The layer's own fade would come on top of that.
            animateTransition = false,
        ),
        content = content,
    )
}

internal actual fun calendarLocale(): CalendarLocale = JavaCalendarLocale(Locale.getDefault(Locale.Category.FORMAT))

private class JavaCalendarLocale(private val locale: Locale) : CalendarLocale {
    override val firstDayOfWeek: DayOfWeek = DayOfWeek(WeekFields.of(locale).firstDayOfWeek.value)
    private val month = DateTimeFormatter.ofPattern(
        monthPattern(
            DateTimeFormatterBuilder.getLocalizedDateTimePattern(FormatStyle.LONG, null, IsoChronology.INSTANCE, locale),
        ),
        locale,
    )
    private val medium = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)
    private val full = DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL).withLocale(locale)

    override fun monthTitle(month: YearMonth): String =
        this.month.format(java.time.YearMonth.of(month.year, month.month.number))

    override fun weekdayInitial(day: DayOfWeek): String =
        java.time.DayOfWeek.of(day.isoDayNumber).getDisplayName(TextStyle.NARROW_STANDALONE, locale)

    override fun mediumDate(date: LocalDate): String = medium.format(date.toJavaLocalDate())

    // The JVM has no word for today in the locale's language: the ring around the day marks it.
    override fun longDate(date: LocalDate, today: Boolean): String = full.format(date.toJavaLocalDate())
}

/**
 * The pattern of a month's heading, made from the locale's pattern of a long date by leaving out
 * the day: "MMMM d, y" gives "LLLL y", "y년 M월 d일" gives "y년 M월". Java has patterns for a
 * month and a year ("yMMMM") only from Java 19, and the desktop app runs on 17. The month's name
 * becomes its standalone form, which some languages decline differently from the one in a date.
 */
internal fun monthPattern(longDate: String): String {
    // The pattern in pieces: a field ("MMMM", "d"), a quoted literal, or one other character.
    val pieces = Regex("""([A-Za-z])\1*|'(?:[^']|'')*'|.""").findAll(longDate).map { it.value }.toList()
    val day = pieces.indexOfFirst { it.first() == 'd' }
    if (day < 0) return longDate
    // The day goes with what follows it up to the next field: "d, ", "d. ", "d일", "d 'de' ".
    var end = day + 1
    while (end < pieces.size && !pieces[end].first().isAsciiLetter()) end++
    val kept = pieces.subList(0, day) + pieces.subList(end, pieces.size)
    return kept.joinToString("") { if (it.matches(Regex("M{4,}"))) "L".repeat(it.length) else it }.trim()
}

private fun Char.isAsciiLetter(): Boolean = this in 'A'..'Z' || this in 'a'..'z'
