package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

// Partial update: null / Patch.Unchanged keep the stored value.
data class UpdateAppointmentDto(
    val veterinarianId: UUID? = null,
    val startAt: Instant? = null,
    val endAt: Instant? = null,
    val status: AppointmentStatus? = null,
    val clientComment: Patch<String?> = Patch.Unchanged,
    val vetNotes: Patch<String?> = Patch.Unchanged,
    val cancelledBy: Patch<UUID?> = Patch.Unchanged,
    val cancelledAt: Patch<Instant?> = Patch.Unchanged,
    val cancelReason: Patch<String?> = Patch.Unchanged,
)
