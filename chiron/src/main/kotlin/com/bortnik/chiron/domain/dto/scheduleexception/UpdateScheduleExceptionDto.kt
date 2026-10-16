package com.bortnik.chiron.domain.dto.scheduleexception

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.LocalDate
import java.time.LocalTime

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateScheduleExceptionDto(
    val type: ScheduleExceptionType? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val startTime: Patch<LocalTime?> = Patch.Unchanged,
    val endTime: Patch<LocalTime?> = Patch.Unchanged,
    val reason: Patch<String?> = Patch.Unchanged,
)
