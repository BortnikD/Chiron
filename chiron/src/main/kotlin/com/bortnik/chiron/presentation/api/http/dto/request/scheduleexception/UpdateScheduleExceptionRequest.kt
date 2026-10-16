package com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.utils.ValidationConstants.ScheduleExceptionRules
import jakarta.validation.constraints.Size
import org.openapitools.jackson.nullable.JsonNullable
import java.time.LocalDate
import java.time.LocalTime

// Partial update: omitted fields keep their values; JsonNullable fields are cleared by an explicit null.
data class UpdateScheduleExceptionRequest(
    val type: ScheduleExceptionType? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val startTime: JsonNullable<LocalTime?> = JsonNullable.undefined(),
    val endTime: JsonNullable<LocalTime?> = JsonNullable.undefined(),
    @field:Size(
        max = ScheduleExceptionRules.REASON_MAX_LENGTH,
        message = "must be at most ${ScheduleExceptionRules.REASON_MAX_LENGTH} characters",
    )
    val reason: JsonNullable<String?> = JsonNullable.undefined(),
)
