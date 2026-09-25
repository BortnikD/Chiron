package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

// Null fields are not filtered on; from / to bound startAt as [from, to).
data class AppointmentFilter(
    val veterinarianId: UUID? = null,
    val petId: UUID? = null,
    val ownerId: UUID? = null,
    val serviceId: UUID? = null,
    val statuses: Set<AppointmentStatus>? = null,
    val from: Instant? = null,
    val to: Instant? = null,
)
