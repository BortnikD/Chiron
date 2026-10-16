package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.utils.ValidationConstants.ScheduleExceptionRules
import java.time.LocalDate
import java.time.LocalTime

object ScheduleExceptionValidator {

    fun validate(filter: ScheduleExceptionFilter) = validateAll {
        ensureNotBefore("to", filter.to, "from", filter.from)
    }

    fun validate(dto: CreateScheduleExceptionDto) = validateAll {
        scheduleException(dto.type, dto.startDate, dto.endDate, dto.startTime, dto.endTime, dto.reason)
    }

    // Validates the state the exception will have once the partial update is applied.
    fun validate(existing: ScheduleException, dto: UpdateScheduleExceptionDto) = validateAll {
        scheduleException(
            dto.type ?: existing.type,
            dto.startDate ?: existing.startDate,
            dto.endDate ?: existing.endDate,
            dto.startTime.orElse(existing.startTime),
            dto.endTime.orElse(existing.endTime),
            dto.reason.orElse(null),
        )
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
