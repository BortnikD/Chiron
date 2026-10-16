package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import java.time.LocalTime

object WorkScheduleValidator {

    fun validate(dto: CreateWorkScheduleDto) = validateAll {
        workingHours(dto.startTime, dto.endTime, dto.breakStart, dto.breakEnd)
    }

    // Validates the state the schedule will have once the partial update is applied.
    fun validate(existing: WorkSchedule, dto: UpdateWorkScheduleDto) = validateAll {
        workingHours(
            dto.startTime ?: existing.startTime,
            dto.endTime ?: existing.endTime,
            dto.breakStart.orElse(existing.breakStart),
            dto.breakEnd.orElse(existing.breakEnd),
        )
    }

    private fun ValidationErrorCollector.workingHours(
        startTime: LocalTime,
        endTime: LocalTime,
        breakStart: LocalTime?,
        breakEnd: LocalTime?,
    ) {
        ensure(startTime < endTime, "startTime", "must be before endTime")
        ensure((breakStart == null) == (breakEnd == null), "breakStart", "breakStart and breakEnd must be set together")
        if (breakStart != null && breakEnd != null) {
            ensure(breakStart < breakEnd, "breakStart", "must be before breakEnd")
            ensure(breakStart >= startTime && breakEnd <= endTime, "breakStart", "break must be within working hours")
        }
    }
}
