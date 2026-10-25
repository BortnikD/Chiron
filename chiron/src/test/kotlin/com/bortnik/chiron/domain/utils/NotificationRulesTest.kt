package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.dto.notification.NotificationTarget
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.NotificationType
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NotificationRulesTest {

    @Test
    fun `client booking notifies only the veterinarian`() {
        val targets = rules(before = null, after = appointment(), actorId = OWNER)

        assertEquals(listOf(NotificationTarget(NotificationType.APPOINTMENT_BOOKED, setOf(VET_USER))), targets)
    }

    @Test
    fun `admin booking notifies both parties`() {
        val targets = rules(before = null, after = appointment(), actorId = ADMIN)

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_BOOKED, setOf(OWNER, VET_USER))),
            targets,
        )
    }

    @Test
    fun `follow-up scheduled by the veterinarian notifies the owner`() {
        val targets = rules(before = null, after = appointment(followUpOf = UUID.randomUUID()), actorId = VET_USER)

        assertEquals(listOf(NotificationTarget(NotificationType.FOLLOW_UP_SCHEDULED, setOf(OWNER))), targets)
    }

    @Test
    fun `confirmation notifies only the owner even when an admin confirms`() {
        val before = appointment()
        val after = before.copy(status = AppointmentStatus.CONFIRMED)

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_CONFIRMED, setOf(OWNER))),
            rules(before, after, actorId = ADMIN),
        )
    }

    @Test
    fun `cancellation notifies the other party`() {
        val before = appointment()
        val after = before.copy(status = AppointmentStatus.CANCELLED)

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_CANCELLED, setOf(VET_USER))),
            rules(before, after, actorId = OWNER),
        )
        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_CANCELLED, setOf(OWNER))),
            rules(before, after, actorId = VET_USER),
        )
        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_CANCELLED, setOf(OWNER, VET_USER))),
            rules(before, after, actorId = ADMIN),
        )
    }

    @Test
    fun `no-show notifies the owner`() {
        val before = appointment(status = AppointmentStatus.CONFIRMED)

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_NO_SHOW, setOf(OWNER))),
            rules(before, before.copy(status = AppointmentStatus.NO_SHOW), actorId = VET_USER),
        )
    }

    @Test
    fun `completion and repeated status notify nobody`() {
        val before = appointment(status = AppointmentStatus.CONFIRMED)

        assertTrue(rules(before, before.copy(status = AppointmentStatus.COMPLETED), actorId = VET_USER).isEmpty())
        assertTrue(rules(before, before.copy(vetNotes = "notes"), actorId = VET_USER).isEmpty())
    }

    @Test
    fun `moving to another veterinarian also notifies the previous one`() {
        val before = appointment()
        val after = before.copy(veterinarianId = UUID.randomUUID())

        assertEquals(
            listOf(
                NotificationTarget(NotificationType.APPOINTMENT_RESCHEDULED, setOf(OWNER, VET_USER, PREVIOUS_VET_USER)),
            ),
            rules(before, after, actorId = ADMIN, previousVeterinarianUserId = PREVIOUS_VET_USER),
        )
    }

    @Test
    fun `rescheduling together with a status change yields both notifications`() {
        val before = appointment()
        val after = before.copy(
            startAt = before.startAt + Duration.ofHours(1),
            endAt = before.endAt + Duration.ofHours(1),
            status = AppointmentStatus.CONFIRMED,
        )

        assertEquals(
            listOf(
                NotificationTarget(NotificationType.APPOINTMENT_RESCHEDULED, setOf(OWNER, VET_USER)),
                NotificationTarget(NotificationType.APPOINTMENT_CONFIRMED, setOf(OWNER)),
            ),
            rules(before, after, actorId = ADMIN),
        )
    }

    private fun rules(
        before: Appointment?,
        after: Appointment,
        actorId: UUID,
        previousVeterinarianUserId: UUID? = null,
    ) = NotificationRules.forAppointment(
        before = before,
        after = after,
        actorId = actorId,
        ownerId = OWNER,
        veterinarianUserId = VET_USER,
        previousVeterinarianUserId = previousVeterinarianUserId,
    )

    private fun appointment(
        status: AppointmentStatus = AppointmentStatus.PENDING,
        followUpOf: UUID? = null,
    ): Appointment {
        val startAt = Instant.parse("2026-10-27T07:30:00Z")
        return Appointment(
            id = UUID.randomUUID(),
            veterinarianId = UUID.randomUUID(),
            petId = UUID.randomUUID(),
            serviceId = UUID.randomUUID(),
            followUpOf = followUpOf,
            startAt = startAt,
            endAt = startAt + Duration.ofMinutes(30),
            status = status,
            priceSnapshot = 1500.0,
            createdAt = startAt,
            updatedAt = startAt,
        )
    }

    private companion object {
        val OWNER: UUID = UUID.randomUUID()
        val VET_USER: UUID = UUID.randomUUID()
        val PREVIOUS_VET_USER: UUID = UUID.randomUUID()
        val ADMIN: UUID = UUID.randomUUID()
    }
}
