package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.exceptions.ConflictException
import com.bortnik.chiron.domain.exceptions.ValidationError
import com.bortnik.chiron.domain.utils.ValidationConstants.ScheduleExceptionRules
import java.time.LocalDate
import java.time.LocalTime

object ScheduleExceptionValidator {

    fun validate(filter: ScheduleExceptionFilter) = validateAll {
        ensureNotBefore("to", filter.to, "from", filter.from)
    }

    fun validate(dto: CreateScheduleExceptionDto, exceptions: List<ScheduleException>) {
        validateAll { scheduleException(dto.type, dto.startDate, dto.endDate, dto.startTime, dto.endTime, dto.reason) }
        noOverlappingCustomHours(dto.type, dto.startDate, dto.endDate, exceptions)
    }

    // Validates the state the exception will have once the partial update is applied.
    fun validate(
        existing: ScheduleException, dto: UpdateScheduleExceptionDto, exceptions: List<ScheduleException>,
    ) {
        val type = dto.type ?: existing.type
        val startDate = dto.startDate ?: existing.startDate
        val endDate = dto.endDate ?: existing.endDate
        validateAll {
            scheduleException(
                type, startDate, endDate, dto.startTime.orElse(existing.startTime),
                dto.endTime.orElse(existing.endTime), dto.reason.orElse(null),
            )
        }
        noOverlappingCustomHours(type, startDate, endDate, exceptions.filter { it.id != existing.id })
    }

    private fun noOverlappingCustomHours(
        type: ScheduleExceptionType,
        startDate: LocalDate,
        endDate: LocalDate,
        exceptions: List<ScheduleException>,
    ) {
        if (type == ScheduleExceptionType.CUSTOM_HOURS && exceptions.any {
                it.type == ScheduleExceptionType.CUSTOM_HOURS && it.startDate <= endDate && it.endDate >= startDate
            }) {
            val message = "Custom working hours must not overlap another custom working hours date range"
            throw ConflictException(message, errors = listOf(ValidationError("startDate", message)))
        }
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
