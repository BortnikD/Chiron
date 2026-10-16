package com.bortnik.chiron.domain.dto.workschedule

import com.bortnik.chiron.domain.dto.Patch
import java.time.LocalTime

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateWorkScheduleDto(
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val breakStart: Patch<LocalTime?> = Patch.Unchanged,
    val breakEnd: Patch<LocalTime?> = Patch.Unchanged,
)
