package com.bortnik.chiron.domain.dto.statistics

import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.test.assertEquals

class StatisticsPeriodTest {

    @Test
    fun `without dates the current month is used`() {
        val period = StatisticsPeriod.of(null, null, ZONE, today = LocalDate.of(2026, 2, 14))

        assertEquals(LocalDate.of(2026, 2, 1), period.from)
        assertEquals(LocalDate.of(2026, 2, 28), period.to)
    }

    @Test
    fun `a single date anchors the month of the missing one`() {
        val fromOnly = StatisticsPeriod.of(LocalDate.of(2026, 11, 15), null, ZONE, today = TODAY)
        val toOnly = StatisticsPeriod.of(null, LocalDate.of(2026, 11, 15), ZONE, today = TODAY)

        assertEquals(LocalDate.of(2026, 11, 30), fromOnly.to)
        assertEquals(LocalDate.of(2026, 11, 1), toOnly.from)
    }

    @Test
    fun `bounds are clinic-local midnights and include the last day`() {
        val period = StatisticsPeriod(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), ZONE)

        assertEquals(Instant.parse("2026-09-30T21:00:00Z"), period.start)
        assertEquals(Instant.parse("2026-10-31T21:00:00Z"), period.end)
    }

    @Test
    fun `weekly buckets start on monday and cover the whole period`() {
        // 2026-10-01 is a Thursday, 2026-10-14 a Wednesday.
        val period = StatisticsPeriod(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 14), ZONE)

        assertEquals(
            listOf(LocalDate.of(2026, 9, 28), LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 12)),
            period.bucketStarts(StatisticsGranularity.WEEK),
        )
    }

    @Test
    fun `monthly buckets start on the first day of each month`() {
        val period = StatisticsPeriod(LocalDate.of(2026, 1, 31), LocalDate.of(2026, 3, 1), ZONE)

        assertEquals(
            listOf(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1)),
            period.bucketStarts(StatisticsGranularity.MONTH),
        )
    }

    @Test
    fun `daily buckets list every date of the period`() {
        val period = StatisticsPeriod(LocalDate.of(2026, 10, 30), LocalDate.of(2026, 11, 1), ZONE)

        assertEquals(
            listOf(LocalDate.of(2026, 10, 30), LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 1)),
            period.bucketStarts(StatisticsGranularity.DAY),
        )
    }

    private companion object {
        val ZONE: ZoneId = ZoneId.of("Europe/Moscow")
        val TODAY: LocalDate = LocalDate.of(2026, 10, 25)
    }
}
