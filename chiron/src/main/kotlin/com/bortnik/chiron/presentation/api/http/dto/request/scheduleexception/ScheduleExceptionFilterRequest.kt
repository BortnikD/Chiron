package com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import io.swagger.v3.oas.annotations.Parameter
import java.time.LocalDate
import java.util.UUID

data class ScheduleExceptionFilterRequest(
    val veterinarianId: UUID? = null,
    val type: ScheduleExceptionType? = null,
    @field:Parameter(description = "Exceptions ending on or after this ISO-8601 date")
    val from: LocalDate? = null,
    @field:Parameter(description = "Exceptions starting on or before this ISO-8601 date")
    val to: LocalDate? = null,
)
