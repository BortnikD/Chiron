package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MAX
import com.bortnik.chiron.domain.utils.ValidationConstants.MONEY_MIN
import java.time.Duration
import java.time.Instant

object AppointmentValidator {

    fun validate(dto: CreateAppointmentDto) = validateAll {
        timeRange(dto.startAt, dto.endAt)
        ensureInRange("priceSnapshot", dto.priceSnapshot, MONEY_MIN, MONEY_MAX)
        ensureMaxLength("clientComment", dto.clientComment, AppointmentRules.CLIENT_COMMENT_MAX_LENGTH)
    }

    fun validate(dto: UpdateAppointmentDto) = validateAll {
        timeRange(dto.startAt, dto.endAt)
        ensureMaxLength("clientComment", dto.clientComment, AppointmentRules.CLIENT_COMMENT_MAX_LENGTH)
        ensureMaxLength("vetNotes", dto.vetNotes, AppointmentRules.VET_NOTES_MAX_LENGTH)
        ensureMaxLength("cancelReason", dto.cancelReason, AppointmentRules.CANCEL_REASON_MAX_LENGTH)
        if (dto.status == AppointmentStatus.CANCELLED) {
            ensure(dto.cancelledBy != null, "cancelledBy", "is required when status is CANCELLED")
            ensure(dto.cancelledAt != null, "cancelledAt", "is required when status is CANCELLED")
        } else {
            ensure(
                dto.cancelledBy == null && dto.cancelledAt == null && dto.cancelReason == null,
                "cancelledBy",
                "cancellation fields are allowed only when status is CANCELLED",
            )
        }
    }

    private fun ValidationErrorCollector.timeRange(startAt: Instant, endAt: Instant) {
        ensure(endAt.isAfter(startAt), "endAt", "must be after startAt")
        ensure(
            Duration.between(startAt, endAt).toMinutes() <= AppointmentRules.MAX_DURATION_MINUTES,
            "endAt",
            "appointment must not be longer than ${AppointmentRules.MAX_DURATION_MINUTES} minutes",
        )
    }
}
