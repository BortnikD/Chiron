package com.bortnik.chiron.presentation.api.http.dto.request.workschedule

import org.openapitools.jackson.nullable.JsonNullable
import java.time.LocalTime

// Partial update: omitted fields keep their values; the break is removed by an explicit null in both fields.
data class UpdateWorkScheduleRequest(
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val breakStart: JsonNullable<LocalTime?> = JsonNullable.undefined(),
    val breakEnd: JsonNullable<LocalTime?> = JsonNullable.undefined(),
)
