package com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.utils.ValidationConstants.ScheduleExceptionRules
import jakarta.validation.constraints.Size
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
    @field:Size(
        max = ScheduleExceptionRules.REASON_MAX_LENGTH,
        message = "must be at most ${ScheduleExceptionRules.REASON_MAX_LENGTH} characters",
    )
    val reason: String? = null,
)
