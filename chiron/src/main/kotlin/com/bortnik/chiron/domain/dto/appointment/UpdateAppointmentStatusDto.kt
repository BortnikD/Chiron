package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

data class UpdateAppointmentStatusDto(
    val status: AppointmentStatus,
    val vetNotes: String? = null,
    val cancelReason: String? = null,
)
