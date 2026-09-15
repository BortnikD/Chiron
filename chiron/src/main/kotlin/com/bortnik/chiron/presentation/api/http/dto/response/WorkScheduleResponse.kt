package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID

data class WorkScheduleResponse(
    val id: UUID,
    val veterinarianId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime?,
    val breakEnd: LocalTime?,
)
