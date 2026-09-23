package com.bortnik.chiron.domain.dto.appointment

import java.time.Instant
import java.util.UUID

// What a client sends when booking: the price snapshot and the initial status are decided by the application.
data class BookAppointmentDto(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceId: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val clientComment: String? = null,
)
