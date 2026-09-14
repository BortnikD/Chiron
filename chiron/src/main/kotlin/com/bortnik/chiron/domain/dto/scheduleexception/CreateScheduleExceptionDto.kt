package com.bortnik.chiron.domain.dto.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class CreateScheduleExceptionDto(
    val veterinarianId: UUID,
    val type: ScheduleExceptionType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val reason: String? = null,
)
