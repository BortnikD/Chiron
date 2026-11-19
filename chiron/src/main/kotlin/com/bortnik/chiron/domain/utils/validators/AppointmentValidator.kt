package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

object AppointmentValidator {

    fun validate(dto: CreateAppointmentDto) = validateAll {
        timeRange(dto.startAt, dto.endAt)
        serviceIds(dto.serviceIds, "serviceIds", allowEmpty = false)
        ensureMaxLength("clientComment", dto.clientComment, AppointmentRules.CLIENT_COMMENT_MAX_LENGTH)
    }

    // Validates the state the appointment will have once the partial update is applied.
    fun validate(existing: Appointment, dto: UpdateAppointmentDto) = validateAll {
        val cancelledBy = dto.cancelledBy.orElse(existing.cancelledBy)
        val cancelledAt = dto.cancelledAt.orElse(existing.cancelledAt)
        val cancelReason = dto.cancelReason.orElse(existing.cancelReason)
        timeRange(dto.startAt ?: existing.startAt, dto.endAt ?: existing.endAt)
        dto.serviceIds?.let { serviceIds(it, "serviceIds", allowEmpty = false) }
        dto.performedServiceIds?.let { serviceIds(it, "performedServiceIds", allowEmpty = true) }
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

    fun validate(filter: AppointmentFilter) = validateAll {
        ensureAfter("to", filter.to, "from", filter.from)
    }

    fun validate(filter: AvailableSlotFilter) = validateAll {
        serviceIds(filter.serviceIds, "serviceIds", allowEmpty = false)
        ensureNotBefore("to", filter.to, "from", filter.from)
        ensure(
            ChronoUnit.DAYS.between(filter.from, filter.to) < AppointmentRules.SLOT_SEARCH_MAX_DAYS,
            "to",
            "period must not be longer than ${AppointmentRules.SLOT_SEARCH_MAX_DAYS} days",
        )
    }

    fun validateServiceIds(ids: List<UUID>, field: String = "serviceIds", allowEmpty: Boolean = false) =
        validateAll { serviceIds(ids, field, allowEmpty) }

    fun validateDurationMinutes(minutes: Long) = validateAll {
        ensure(
            minutes <= AppointmentRules.MAX_DURATION_MINUTES,
            "serviceIds",
            "total duration including buffer must not exceed ${AppointmentRules.MAX_DURATION_MINUTES} minutes",
        )
    }

    private fun ValidationErrorCollector.serviceIds(ids: List<UUID>, field: String, allowEmpty: Boolean) {
        ensure(allowEmpty || ids.isNotEmpty(), field, "must not be empty")
        ensure(
            ids.size <= AppointmentRules.MAX_SERVICES,
            field,
            "must contain at most ${AppointmentRules.MAX_SERVICES} services"
        )
        ensure(ids.distinct().size == ids.size, field, "must not contain duplicates")
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
