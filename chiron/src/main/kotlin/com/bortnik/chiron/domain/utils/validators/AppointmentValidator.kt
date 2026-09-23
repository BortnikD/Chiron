package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.entities.Appointment
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

    // Validates the state the appointment will have once the partial update is applied.
    fun validate(existing: Appointment, dto: UpdateAppointmentDto) = validateAll {
        val cancelledBy = dto.cancelledBy.orElse(existing.cancelledBy)
        val cancelledAt = dto.cancelledAt.orElse(existing.cancelledAt)
        val cancelReason = dto.cancelReason.orElse(existing.cancelReason)
        timeRange(dto.startAt ?: existing.startAt, dto.endAt ?: existing.endAt)
        ensureMaxLength("clientComment", dto.clientComment.orElse(null), AppointmentRules.CLIENT_COMMENT_MAX_LENGTH)
        ensureMaxLength("vetNotes", dto.vetNotes.orElse(null), AppointmentRules.VET_NOTES_MAX_LENGTH)
        ensureMaxLength("cancelReason", cancelReason, AppointmentRules.CANCEL_REASON_MAX_LENGTH)
        if ((dto.status ?: existing.status) == AppointmentStatus.CANCELLED) {
            ensure(cancelledBy != null, "cancelledBy", "is required when status is CANCELLED")
            ensure(cancelledAt != null, "cancelledAt", "is required when status is CANCELLED")
        } else {
            ensure(
                cancelledBy == null && cancelledAt == null && cancelReason == null,
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
