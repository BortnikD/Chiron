package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

data class VeterinarianUpdateAppointmentRequest(
    val status: AppointmentStatus,
    val vetNotes: String? = null,
    val cancelReason: String? = null,
)
