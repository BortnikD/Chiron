package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.dto.notification.NotificationTarget
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.util.UUID

// The parties of an appointment are the pet owner and the veterinarian's user. Confirmation and no-show concern
// only the owner; the other events go to both parties. The user who made the change is never notified, and admins
// are never a party, so they only appear as actors.
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
            val type = if (after.followUpOf != null) {
                NotificationType.FOLLOW_UP_SCHEDULED
            } else {
                NotificationType.APPOINTMENT_BOOKED
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
                    AppointmentStatus.PENDING, AppointmentStatus.COMPLETED -> Unit
                }
            }
        }

        return targets
            .map { it.copy(recipientIds = it.recipientIds - actorId) }
            .filter { it.recipientIds.isNotEmpty() }
    }
}
