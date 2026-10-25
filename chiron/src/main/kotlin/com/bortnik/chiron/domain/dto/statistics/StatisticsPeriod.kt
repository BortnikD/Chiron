package com.bortnik.chiron.domain.dto.statistics

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.TemporalAdjusters

// from / to are dates in the clinic time zone, both inclusive; appointments are matched by startAt in [start, end).
data class StatisticsPeriod(
    val from: LocalDate,
    val to: LocalDate,
    val zone: ZoneId,
) {
    val start: Instant get() = from.atStartOfDay(zone).toInstant()

    val end: Instant get() = to.plusDays(1).atStartOfDay(zone).toInstant()

    // Start dates of every bucket that overlaps the period, including the empty ones.
    fun bucketStarts(granularity: StatisticsGranularity): List<LocalDate> =
        generateSequence(granularity.truncate(from)) { it.plus(granularity.step) }
            .takeWhile { !it.isAfter(to) }
            .toList()

    companion object {
        // A missing date is taken from the month of the other one, or of today when both are missing.
        fun of(from: LocalDate?, to: LocalDate?, zone: ZoneId, today: LocalDate = LocalDate.now(zone)) =
            (from ?: to ?: today).let { anchor ->
                StatisticsPeriod(
                    from = from ?: anchor.withDayOfMonth(1),
                    to = to ?: anchor.with(TemporalAdjusters.lastDayOfMonth()),
                    zone = zone,
                )
            }
    }
}
