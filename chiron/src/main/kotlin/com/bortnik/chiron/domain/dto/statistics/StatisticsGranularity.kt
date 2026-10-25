package com.bortnik.chiron.domain.dto.statistics

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Period

enum class StatisticsGranularity(val step: Period) {
    DAY(Period.ofDays(1)),
    WEEK(Period.ofWeeks(1)),
    MONTH(Period.ofMonths(1)),
    ;

    // Mirrors date_trunc in PostgreSQL: a week starts on Monday.
    fun truncate(date: LocalDate): LocalDate = when (this) {
        DAY -> date
        WEEK -> date.with(DayOfWeek.MONDAY)
        MONTH -> date.withDayOfMonth(1)
    }
}
