package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.dto.notification.NotificationTarget
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.util.UUID

// Appointment events go to the affected parties, excluding the user who made the change.
object NotificationRules {

    // before is null when the appointment has just been created; previousVeterinarianUserId is the user of the
    // veterinarian the appointment was moved away from, if it was.
    fun forAppointment(
        before: Appointment?,
        after: Appointment,
        actorId: UUID,
        ownerId: UUID,
        veterinarianUserId: UUID,
        previousVeterinarianUserId: UUID? = null,
    ): List<NotificationTarget> {
        val parties = setOf(ownerId, veterinarianUserId)
        val targets = mutableListOf<NotificationTarget>()

        if (before == null) {
            val type = when (after.status) {
                AppointmentStatus.PENDING -> if (after.followUpOf != null) {
                    NotificationType.FOLLOW_UP_SCHEDULED
                } else {
                    NotificationType.APPOINTMENT_BOOKED
                }

                AppointmentStatus.CONFIRMED -> if (after.followUpOf != null) {
                    NotificationType.FOLLOW_UP_SCHEDULED
                } else {
                    NotificationType.APPOINTMENT_CONFIRMED
                }

                AppointmentStatus.CANCELLED -> NotificationType.APPOINTMENT_CANCELLED
                AppointmentStatus.COMPLETED -> NotificationType.APPOINTMENT_COMPLETED
                AppointmentStatus.NO_SHOW -> NotificationType.APPOINTMENT_NO_SHOW
            }
            targets += NotificationTarget(type, parties)
        } else {
            val rescheduled = before.veterinarianId != after.veterinarianId ||
                    before.startAt != after.startAt ||
                    before.endAt != after.endAt
            if (rescheduled) {
                targets += NotificationTarget(
                    NotificationType.APPOINTMENT_RESCHEDULED,
                    parties + setOfNotNull(previousVeterinarianUserId),
                )
            }
            if (before.status != after.status) {
                when (after.status) {
                    AppointmentStatus.CONFIRMED ->
                        targets += NotificationTarget(NotificationType.APPOINTMENT_CONFIRMED, setOf(ownerId))

                    AppointmentStatus.CANCELLED ->
                        targets += NotificationTarget(NotificationType.APPOINTMENT_CANCELLED, parties)

                    AppointmentStatus.NO_SHOW ->
                        targets += NotificationTarget(NotificationType.APPOINTMENT_NO_SHOW, setOf(ownerId))

                    AppointmentStatus.COMPLETED ->
                        targets += NotificationTarget(NotificationType.APPOINTMENT_COMPLETED, setOf(ownerId))

                    AppointmentStatus.PENDING -> Unit
                }
            }
        }

        if (before != null) {
            val previousServices = before.services.associate { it.serviceId to (it.isPlanned to it.isPerformed) }
            val currentServices = after.services.associate { it.serviceId to (it.isPlanned to it.isPerformed) }
            if (previousServices != currentServices &&
                !(before.status != after.status && after.status == AppointmentStatus.COMPLETED)
            ) {
                targets += NotificationTarget(NotificationType.APPOINTMENT_SERVICES_UPDATED, parties)
            }
            val notesRecipients = mutableSetOf<UUID>()
            if (before.vetNotes != after.vetNotes) notesRecipients += ownerId
            if (before.clientComment != after.clientComment) notesRecipients += veterinarianUserId
            if (notesRecipients.isNotEmpty()) {
                targets += NotificationTarget(NotificationType.APPOINTMENT_NOTES_UPDATED, notesRecipients)
            }
        }

        return targets
            .map { it.copy(recipientIds = it.recipientIds - actorId) }
            .filter { it.recipientIds.isNotEmpty() }
    }
}
