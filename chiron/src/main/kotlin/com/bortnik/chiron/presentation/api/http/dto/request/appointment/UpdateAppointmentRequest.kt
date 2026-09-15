package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class UpdateAppointmentRequest(
    val veterinarianId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    val clientComment: String? = null,
    val vetNotes: String? = null,
    val cancelledBy: UUID? = null,
    val cancelledAt: Instant? = null,
    val cancelReason: String? = null,
)
