package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

// What a veterinarian may filter by: the veterinarian is always the current user and is set by the application.
data class VeterinarianAppointmentFilter(
    val petId: UUID? = null,
    val statuses: Set<AppointmentStatus>? = null,
    val from: Instant? = null,
    val to: Instant? = null,
)
