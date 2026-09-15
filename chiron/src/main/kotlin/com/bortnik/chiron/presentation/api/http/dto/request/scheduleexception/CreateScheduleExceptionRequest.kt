package com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class CreateScheduleExceptionRequest(
    val veterinarianId: UUID,
    val type: ScheduleExceptionType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val reason: String? = null,
)
