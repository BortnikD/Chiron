package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.utils.ValidationConstants.ScheduleExceptionRules
import java.time.LocalDate
import java.time.LocalTime

object ScheduleExceptionValidator {

    fun validate(dto: CreateScheduleExceptionDto) = validateAll {
        scheduleException(dto.type, dto.startDate, dto.endDate, dto.startTime, dto.endTime, dto.reason)
    }

    fun validate(dto: UpdateScheduleExceptionDto) = validateAll {
        scheduleException(dto.type, dto.startDate, dto.endDate, dto.startTime, dto.endTime, dto.reason)
    }

    private fun ValidationErrorCollector.scheduleException(
        type: ScheduleExceptionType,
        startDate: LocalDate,
        endDate: LocalDate,
        startTime: LocalTime?,
        endTime: LocalTime?,
        reason: String?,
    ) {
        ensure(!endDate.isBefore(startDate), "endDate", "must not be before startDate")
        ensureMaxLength("reason", reason, ScheduleExceptionRules.REASON_MAX_LENGTH)
        when (type) {
            ScheduleExceptionType.ABSENCE -> {
                ensure(startTime == null && endTime == null, "startTime", "must be empty for ABSENCE")
            }

            ScheduleExceptionType.CUSTOM_HOURS -> {
                ensure(startTime != null && endTime != null, "startTime", "startTime and endTime are required for CUSTOM_HOURS")
                if (startTime != null && endTime != null) {
                    ensure(startTime < endTime, "startTime", "must be before endTime")
                }
            }
        }
    }
}
