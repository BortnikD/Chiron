package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class CreateAppointmentDto(
    val veterinarianId: UUID,
    val petId: UUID,
    val serviceIds: List<UUID>,
    val followUpOf: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus = AppointmentStatus.PENDING,
    val clientComment: String? = null,
)
