package com.bortnik.chiron.presentation.api.http.dto.request.workschedule

import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID

data class CreateWorkScheduleRequest(
    val veterinarianId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime? = null,
    val breakEnd: LocalTime? = null,
)
