package acme.ui

import androidx.compose.ui.unit.dp
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.YearMonth

// The tables every client that draws its own range calendar tests with, so that none of them
// drifts from the web's, whose behavior checks cover the same presses.
class DateRangeTest {
    private fun days(vararg texts: String): List<LocalDate> = texts.map(LocalDate::parse)

    private fun choice(draft: List<LocalDate>, day: String, minLength: Int, maxLength: Int?): RangeChoice =
        rangeDayChoice(draft, LocalDate.parse(day), minLength, maxLength)

    // | Draft | Day | minLength..maxLength | Choice | On the web |
    // | --- | --- | --- | --- | --- |
    // | none | 2026-03-20 | 2..14 | start | check 2 |
    // | 2026-03-10 – 2026-03-14 (whole) | 2026-03-10 | 2..14 | start | check 4 |
    // | 2026-03-20 | 2026-03-15 | 2..14 | start (before the start) | check 3 |
    // | 2026-03-10 | 2026-03-10 | 2..14 | none | check 4 |
    // | 2026-03-10 | 2026-03-11 | 2..14 | none (one night) | check 4 |
    // | 2026-03-10 | 2026-03-12 | 2..14 | end | check 4 |
    // | 2026-03-10 | 2026-03-24 | 2..14 | end (14 nights) | check 4 |
    // | 2026-03-10 | 2026-03-25 | 2..14 | none (15 nights) | check 4 |
    // | 2026-11-16 | 2026-11-16 | 0..none | end (one-day range) | check 5 |
    // | 2026-03-28 | 2026-04-03 | 2..14 | end, across months | check 10 |
    // | 2026-02-27 | 2026-03-01 | 1..none | end (2 nights over February's end) | not checked |
    // | 2024-12-30 | 2025-01-02 | 0..none | end (across a year) | not checked |
    @Test
    fun aPressStartsEndsOrDoesNothingAsTheTableSays() {
        assertEquals(RangeChoice.Start, choice(days(), "2026-03-20", 2, 14))
        assertEquals(RangeChoice.Start, choice(days("2026-03-10", "2026-03-14"), "2026-03-10", 2, 14))
        assertEquals(RangeChoice.Start, choice(days("2026-03-20"), "2026-03-15", 2, 14))
        assertEquals(RangeChoice.None, choice(days("2026-03-10"), "2026-03-10", 2, 14))
        assertEquals(RangeChoice.None, choice(days("2026-03-10"), "2026-03-11", 2, 14))
        assertEquals(RangeChoice.End, choice(days("2026-03-10"), "2026-03-12", 2, 14))
        assertEquals(RangeChoice.End, choice(days("2026-03-10"), "2026-03-24", 2, 14))
        assertEquals(RangeChoice.None, choice(days("2026-03-10"), "2026-03-25", 2, 14))
        assertEquals(RangeChoice.End, choice(days("2026-11-16"), "2026-11-16", 0, null))
        assertEquals(RangeChoice.End, choice(days("2026-03-28"), "2026-04-03", 2, 14))
        assertEquals(RangeChoice.End, choice(days("2026-02-27"), "2026-03-01", 1, null))
        assertEquals(RangeChoice.End, choice(days("2024-12-30"), "2025-01-02", 0, null))
    }

    // And the marks table (band shape, first weekday Sunday):
    //
    // | Range | Day | Mark |
    // | --- | --- | --- |
    // | 03-10..03-14 | 03-10 | start (band on the trailing half) |
    // | 03-10..03-14 | 03-12 | middle |
    // | 03-10..03-14 | 03-14 | end (Saturday: band on the leading half, rounded) |
    // | 03-14..03-17 | 03-15 | middle, row start (Sunday: rounded leading edge) |
    // | 03-10..03-10 | 03-10 | single (no band) |
    // | 03-28..04-03 | 03-31 | middle, last day of the month (flat) |
    // | draft 03-10, preview 03-13 | 03-12 | preview middle |
    private fun marks(range: List<LocalDate>, day: String, preview: String? = null, first: DayOfWeek = DayOfWeek.SUNDAY) =
        dayMarks(LocalDate.parse(day), range, preview?.let(LocalDate::parse), first)

    @Test
    fun theBandRunsFromTheMiddleOfTheStartToTheMiddleOfTheEnd() {
        val range = days("2026-03-10", "2026-03-14")
        assertEquals(DayMarks(start = true, band = Band(BandEdge.Middle, BandEdge.Flat)), marks(range, "2026-03-10"))
        assertEquals(DayMarks(band = Band(BandEdge.Flat, BandEdge.Flat)), marks(range, "2026-03-12"))
        // A Saturday, at the end of its row: the end's circle covers where the band stops.
        assertEquals(DayMarks(end = true, band = Band(BandEdge.Flat, BandEdge.Middle)), marks(range, "2026-03-14"))
        assertEquals(DayMarks(), marks(range, "2026-03-15"))
        assertTrue(marks(range, "2026-03-12").selected)
    }

    @Test
    fun theBandIsRoundedWhereARowStartsOrEndsIt() {
        val range = days("2026-03-14", "2026-03-17")
        assertEquals(Band(BandEdge.Round, BandEdge.Flat), marks(range, "2026-03-15").band)
        assertEquals(Band(BandEdge.Flat, BandEdge.Round), marks(days("2026-03-13", "2026-03-16"), "2026-03-14").band)
        // Weeks from Monday: the same Sunday ends its row instead.
        assertEquals(Band(BandEdge.Flat, BandEdge.Round), marks(range, "2026-03-15", first = DayOfWeek.MONDAY).band)
        // A start on a Saturday and an end on a Sunday have nothing of the band beside them.
        val weekend = days("2026-03-28", "2026-04-05")
        assertEquals(DayMarks(start = true), marks(weekend, "2026-03-28"))
        assertEquals(DayMarks(end = true), marks(weekend, "2026-04-05"))
        assertEquals(Band(BandEdge.Round, BandEdge.Flat), marks(weekend, "2026-03-29").band)
    }

    @Test
    fun aOneDayRangeHasNoBand() {
        assertEquals(DayMarks(start = true, end = true), marks(days("2026-03-10", "2026-03-10"), "2026-03-10"))
    }

    @Test
    fun theBandStaysSquareAtTheEndOfAMonthInTheMiddleOfAWeek() {
        // March 31 is a Tuesday: the band goes on in April.
        val range = days("2026-03-28", "2026-04-03")
        assertEquals(Band(BandEdge.Flat, BandEdge.Flat), marks(range, "2026-03-31").band)
        assertEquals(Band(BandEdge.Flat, BandEdge.Flat), marks(range, "2026-04-01").band)
    }

    @Test
    fun aPreviewMarksTheRangeItWouldMakeWithoutSelectingIt() {
        val draft = days("2026-03-10")
        val middle = marks(draft, "2026-03-12", preview = "2026-03-13")
        assertEquals(DayMarks(band = Band(BandEdge.Flat, BandEdge.Flat), preview = true), middle)
        assertFalse(middle.selected)
        val end = marks(draft, "2026-03-13", preview = "2026-03-13")
        assertTrue(end.end && end.preview && !end.selected)
        val start = marks(draft, "2026-03-10", preview = "2026-03-13")
        assertTrue(start.start && !start.end && start.selected)
        assertEquals(DayMarks(start = true), marks(draft, "2026-03-10"))
    }

    @Test
    fun onlyADayThatWouldEndTheRangeIsPreviewed() {
        val draft = days("2026-03-10")
        assertEquals(LocalDate(2026, 3, 12), previewEnd(draft, LocalDate(2026, 3, 12), 2, 14))
        // One night, fifteen nights, the start itself and a day before it.
        for (day in listOf("2026-03-11", "2026-03-25", "2026-03-10", "2026-03-09")) {
            assertNull(previewEnd(draft, LocalDate.parse(day), 2, 14), day)
        }
        assertNull(previewEnd(days("2026-03-10", "2026-03-14"), LocalDate(2026, 3, 20), 0, null))
    }

    @Test
    fun theEndsAreNamedAfterTheirLabels() {
        val name = "Tuesday, March 10, 2026"
        assertEquals("Check-in, $name", rangeDayName(DayMarks(start = true), name, "Check-in", "Check-out"))
        assertEquals("Check-out, $name", rangeDayName(DayMarks(end = true), name, "Check-in", "Check-out"))
        assertEquals("Check-in, Check-out, $name", rangeDayName(DayMarks(start = true, end = true), name, "Check-in", "Check-out"))
        // The end a preview would make is not chosen yet.
        assertEquals(name, rangeDayName(DayMarks(end = true, preview = true), name, "Check-in", "Check-out"))
    }

    @Test
    fun twoMonthsShowFrom640Dp() {
        assertEquals(1, monthsForWidth(639.dp))
        assertEquals(2, monthsForWidth(640.dp))
    }

    @Test
    fun theTouchListRunsFromTheMonthOfMinToTheMonthOfMax() {
        assertEquals(
            listOf(YearMonth(2026, 3), YearMonth(2026, 4)),
            monthsBetween(LocalDate(2026, 3, 5), LocalDate(2026, 4, 20), YearMonth(2026, 3)),
        )
        // Without them, a year before the opening month and two years after it.
        val open = monthsBetween(null, null, YearMonth(2026, 3))
        assertEquals(37, open.size)
        assertEquals(YearMonth(2025, 3), open.first())
        assertEquals(YearMonth(2028, 3), open.last())
    }

    @Test
    fun theViewMovesOnlyAsFarAsTheFocusNeeds() {
        val march = YearMonth(2026, 3)
        assertEquals(march, keepInView(march, LocalDate(2026, 4, 30), 2))
        assertEquals(YearMonth(2026, 4), keepInView(march, LocalDate(2026, 5, 1), 2))
        assertEquals(YearMonth(2026, 2), keepInView(march, LocalDate(2026, 2, 28), 2))
        assertEquals(YearMonth(2026, 4), keepInView(march, LocalDate(2026, 4, 1), 1))
        assertEquals(listOf(YearMonth(2026, 12), YearMonth(2027, 1)), visibleMonths(YearMonth(2026, 12), 2))
    }

    @Test
    fun aRangeCannotEndBeforeItStarts() {
        assertFailsWith<IllegalArgumentException> { DateRange(LocalDate(2026, 3, 14), LocalDate(2026, 3, 10)) }
    }
}
