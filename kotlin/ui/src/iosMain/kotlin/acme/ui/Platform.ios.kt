package acme.ui

import platform.UIKit.UIAccessibilityIsReduceMotionEnabled
import androidx.compose.runtime.remember
import acme.tokens.TouchSizes
import acme.tokens.Sizes
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth
import kotlinx.datetime.isoDayNumber
import kotlinx.datetime.number
import platform.Foundation.NSCalendar
import platform.Foundation.NSCalendarIdentifierGregorian
import platform.Foundation.NSDate
import platform.Foundation.NSDateComponents
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSDateFormatterFullStyle
import platform.Foundation.NSDateFormatterMediumStyle
import platform.Foundation.NSDateFormatterNoStyle
import platform.Foundation.NSLocale
import platform.Foundation.currentLocale

/** A phone or tablet is used with fingers. */
actual val platformSizes: Sizes = TouchSizes

@Composable
internal actual fun systemReducedMotion(): Boolean = remember { UIAccessibilityIsReduceMotionEnabled() }

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
            // The scrim covers the status bar and the home indicator; what is shown pads itself.
            usePlatformInsets = false,
            // What is shown moves in with the motion tokens, and not at all when Reduce Motion
            // is on. The layer's own fade would come on top of that, whatever the setting.
            animateTransition = false,
        ),
        content = content,
    )
}

internal actual fun calendarLocale(): CalendarLocale = AppleCalendarLocale()

private class AppleCalendarLocale : CalendarLocale {
    // The grid counts days the Gregorian way, so the names do too, whichever calendar the system
    // is set to. The week still starts where the person's settings say.
    private val gregorian = NSCalendar(calendarIdentifier = NSCalendarIdentifierGregorian)
    override val firstDayOfWeek: DayOfWeek = NSCalendar.currentCalendar.firstWeekday.toInt().let {
        // Counted from Sunday, at 1.
        DayOfWeek(if (it == 1) 7 else it - 1)
    }
    private val month = formatter { setLocalizedDateFormatFromTemplate("yMMMM") }
    private val medium = formatter { dateStyle = NSDateFormatterMediumStyle }
    private val full = formatter { dateStyle = NSDateFormatterFullStyle }
    // "Today" in the system's language: a relative formatter says it instead of the date.
    private val relative = formatter {
        dateStyle = NSDateFormatterMediumStyle
        doesRelativeDateFormatting = true
    }
    // From Sunday.
    private val initials = month.veryShortStandaloneWeekdaySymbols

    override fun monthTitle(month: YearMonth): String = this.month.stringFromDate(at(month.year, month.month.number, 1))

    override fun weekdayInitial(day: DayOfWeek): String = initials[day.isoDayNumber % 7] as String

    override fun mediumDate(date: LocalDate): String = medium.stringFromDate(at(date))

    override fun longDate(date: LocalDate, today: Boolean): String {
        val name = full.stringFromDate(at(date))
        return if (today) "${relative.stringFromDate(at(date))}, $name" else name
    }

    private fun formatter(setUp: NSDateFormatter.() -> Unit) = NSDateFormatter().apply {
        locale = NSLocale.currentLocale
        calendar = gregorian
        timeStyle = NSDateFormatterNoStyle
        setUp()
    }

    private fun at(date: LocalDate): NSDate = at(date.year, date.month.number, date.day)

    // At noon, so that no change of the clock moves the moment into another day.
    private fun at(year: Int, month: Int, day: Int): NSDate = gregorian.dateFromComponents(
        NSDateComponents().apply {
            this.year = year.toLong()
            this.month = month.toLong()
            this.day = day.toLong()
            hour = 12
        },
    )!!
}
