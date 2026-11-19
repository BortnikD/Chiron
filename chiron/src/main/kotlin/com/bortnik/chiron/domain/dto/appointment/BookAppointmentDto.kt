package com.bortnik.chiron.domain.dto.appointment

import java.time.Instant
import java.util.UUID

data class BookAppointmentDto(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceIds: List<UUID>,
    val startAt: Instant,
    val endAt: Instant,
    val clientComment: String? = null,
)
