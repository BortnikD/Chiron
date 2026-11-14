package com.bortnik.chiron.domain.dto.notification

import java.util.UUID

data class SendAdminMessageDto(
    val title: String,
    val body: String,
    val appointmentId: UUID? = null,
    val petId: UUID? = null,
    val vaccinationId: UUID? = null,
)
