package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.LocalDate

data class TimelinePointResponse(
    val periodStart: LocalDate,
    val appointments: Long,
    val completed: Long,
    val revenue: Double,
)
