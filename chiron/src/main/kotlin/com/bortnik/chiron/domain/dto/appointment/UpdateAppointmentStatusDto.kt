package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

data class UpdateAppointmentStatusDto(
    val status: AppointmentStatus? = null,
    val vetNotes: Patch<String?> = Patch.Unchanged,
    val cancelReason: String? = null,
)
