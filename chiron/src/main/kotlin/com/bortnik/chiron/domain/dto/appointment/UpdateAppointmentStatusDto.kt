package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class UpdateAppointmentStatusDto(
    val status: AppointmentStatus? = null,
    val vetNotes: Patch<String?> = Patch.Unchanged,
    val cancelReason: String? = null,
    val serviceIds: List<UUID>? = null,
    val performedServiceIds: List<UUID>? = null,
    val endAt: Instant? = null,
)
