package com.bortnik.chiron.domain.dto.notification

import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateNotificationDto(
    val recipientId: UUID,
    val actorId: UUID? = null,
    val type: NotificationType,
    val title: String,
    val body: String,
    val appointmentId: UUID? = null,
    val petId: UUID? = null,
    val vaccinationId: UUID? = null,
    val reminderStartAt: Instant? = null,
    val reminderDueOn: LocalDate? = null,
)
