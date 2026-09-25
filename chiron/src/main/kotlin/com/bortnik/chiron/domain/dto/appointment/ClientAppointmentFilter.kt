package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

// What a client may filter by: the owner is always the current user and is set by the application.
data class ClientAppointmentFilter(
    val petId: UUID? = null,
    val statuses: Set<AppointmentStatus>? = null,
    val from: Instant? = null,
    val to: Instant? = null,
)
