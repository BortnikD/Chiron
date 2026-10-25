package com.bortnik.chiron.domain.dto.statistics

import java.time.LocalDate

// periodStart is the first date of the bucket; for WEEK / MONTH it may precede the period start.
data class TimelinePoint(
    val periodStart: LocalDate,
    val appointments: AppointmentTotals,
)
