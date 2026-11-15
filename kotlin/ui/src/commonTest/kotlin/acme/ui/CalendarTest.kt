package acme.ui

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth
import kotlinx.datetime.yearMonth

// The table every client that draws its own calendar tests its keys with, so that none of them
// drifts from the web's, whose behavior checks cover the same moves.
class CalendarTest {
    private val min = LocalDate(2026, 3, 5)
    private val max = LocalDate(2026, 4, 20)

    private fun move(from: String, key: CalendarKey, ranged: Boolean = true): LocalDate =
        moveFocus(LocalDate.parse(from), key, if (ranged) min else null, if (ranged) max else null)

    @Test
    fun theArrowsMoveADayOrAWeekAndStopAtTheMinimum() {
        assertEquals(LocalDate(2026, 3, 11), move("2026-03-10", CalendarKey.Right))
        assertEquals(LocalDate(2026, 3, 9), move("2026-03-10", CalendarKey.Left))
        assertEquals(LocalDate(2026, 3, 17), move("2026-03-10", CalendarKey.Down))
        // March 3 is before the minimum.
        assertEquals(LocalDate(2026, 3, 5), move("2026-03-10", CalendarKey.Up))
    }

    @Test
    fun pageUpAndPageDownMoveAMonthAndStopAtTheRange() {
        assertEquals(LocalDate(2026, 4, 10), move("2026-03-10", CalendarKey.PageDown))
        assertEquals(LocalDate(2026, 3, 5), move("2026-03-10", CalendarKey.PageUp))
        assertEquals(LocalDate(2026, 4, 20), move("2026-04-05", CalendarKey.PageDown))
    }

    @Test
    fun shiftMovesAYear() {
        assertEquals(LocalDate(2026, 3, 5), move("2026-04-20", CalendarKey.ShiftPageUp))
        assertEquals(LocalDate(2027, 3, 10), move("2026-03-10", CalendarKey.ShiftPageDown, ranged = false))
    }

    @Test
    fun aMonthOnKeepsTheDayOrTheLastDayOfAShorterMonth() {
        assertEquals(LocalDate(2026, 2, 28), move("2026-01-31", CalendarKey.PageDown, ranged = false))
        assertEquals(LocalDate(2025, 2, 28), move("2024-02-29", CalendarKey.ShiftPageDown, ranged = false))
    }

    @Test
    fun homeAndEndGoToTheEndsOfTheMonthWithinTheRange() {
        assertEquals(LocalDate(2026, 3, 5), move("2026-03-10", CalendarKey.Home))
        assertEquals(LocalDate(2026, 3, 31), move("2026-03-10", CalendarKey.End))
        assertEquals(LocalDate(2026, 4, 20), move("2026-04-15", CalendarKey.End))
    }

    @Test
    fun withNothingChosenTheCalendarOpensOnTodayHeldInTheRange() {
        val day = openingDay(value = null, today = LocalDate(2026, 11, 14), min = min, max = max)
        assertEquals(LocalDate(2026, 4, 20), day)
        assertEquals(YearMonth(2026, 4), day.yearMonth)
    }

    @Test
    fun theFirstWeekStartsInTheColumnOfTheFirstDay() {
        // March 1, 2026 is a Sunday.
        val march = YearMonth(2026, 3)
        assertEquals(0, monthWeeks(march, DayOfWeek.SUNDAY).first().indexOf(LocalDate(2026, 3, 1)))
        assertEquals(6, monthWeeks(march, DayOfWeek.MONDAY).first().indexOf(LocalDate(2026, 3, 1)))
        // Every week has seven columns, and every day of the month is in one of them.
        val weeks = monthWeeks(march, DayOfWeek.MONDAY)
        assertEquals(List(weeks.size) { 7 }, weeks.map { it.size })
        assertEquals((1..31).toList(), weeks.flatten().filterNotNull().map { it.day })
    }
}
