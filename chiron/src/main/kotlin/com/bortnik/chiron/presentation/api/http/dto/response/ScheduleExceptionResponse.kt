package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class ScheduleExceptionResponse(
    val id: UUID,
    val veterinarianId: UUID,
    val type: ScheduleExceptionType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val startTime: LocalTime?,
    val endTime: LocalTime?,
    val reason: String?,
)
