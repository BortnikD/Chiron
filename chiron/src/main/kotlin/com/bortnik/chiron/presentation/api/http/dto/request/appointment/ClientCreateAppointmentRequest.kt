package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import java.time.Instant
import java.util.UUID

data class ClientCreateAppointmentRequest(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val clientComment: String? = null,
)
