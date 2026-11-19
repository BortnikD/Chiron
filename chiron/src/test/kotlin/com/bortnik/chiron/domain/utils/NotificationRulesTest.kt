package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.dto.notification.NotificationTarget
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
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
    fun `completion notifies the owner and repeated status notifies nobody`() {
        val before = appointment(status = AppointmentStatus.CONFIRMED)

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_COMPLETED, setOf(OWNER))),
            rules(before, before.copy(status = AppointmentStatus.COMPLETED), actorId = VET_USER),
        )
        assertTrue(rules(before, before, actorId = VET_USER).isEmpty())
    }

    @Test
    fun `initial status determines the notification instead of announcing a booking`() {
        val types = mapOf(
            AppointmentStatus.CONFIRMED to NotificationType.APPOINTMENT_CONFIRMED,
            AppointmentStatus.CANCELLED to NotificationType.APPOINTMENT_CANCELLED,
            AppointmentStatus.COMPLETED to NotificationType.APPOINTMENT_COMPLETED,
            AppointmentStatus.NO_SHOW to NotificationType.APPOINTMENT_NO_SHOW,
        )
        for ((status, type) in types) {
            assertEquals(
                listOf(NotificationTarget(type, setOf(OWNER, VET_USER))),
                rules(null, appointment(status), actorId = ADMIN),
            )
        }
    }

    @Test
    fun `adding editing and clearing veterinarian notes notifies the owner`() {
        for ((old, updated) in listOf(null to "Notes", "Notes" to "New notes", "Notes" to null)) {
            val before = appointment().copy(vetNotes = old)
            assertEquals(
                listOf(NotificationTarget(NotificationType.APPOINTMENT_NOTES_UPDATED, setOf(OWNER))),
                rules(before, before.copy(vetNotes = updated), actorId = VET_USER),
            )
        }
    }

    @Test
    fun `client comment updates notify veterinarian and unchanged notes notify nobody`() {
        val before = appointment().copy(vetNotes = "Notes")
        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_NOTES_UPDATED, setOf(VET_USER))),
            rules(before, before.copy(clientComment = "Comment"), actorId = ADMIN),
        )
        assertTrue(rules(before, before.copy(vetNotes = "Notes"), actorId = ADMIN).isEmpty())
    }

    @Test
    fun `completion together with notes notifies about both changes`() {
        val before = appointment(status = AppointmentStatus.CONFIRMED)
        assertEquals(
            listOf(
                NotificationTarget(NotificationType.APPOINTMENT_COMPLETED, setOf(OWNER)),
                NotificationTarget(NotificationType.APPOINTMENT_NOTES_UPDATED, setOf(OWNER)),
            ),
            rules(before, before.copy(status = AppointmentStatus.COMPLETED, vetNotes = "Notes"), actorId = VET_USER),
        )
    }

    @Test
    fun `performed service changes notify both parties except the author`() {
        val before = appointment(AppointmentStatus.COMPLETED)
        val after = before.copy(services = before.services.map { it.copy(isPerformed = true) })

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_SERVICES_UPDATED, setOf(OWNER))),
            rules(before, after, actorId = VET_USER),
        )
        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_SERVICES_UPDATED, setOf(OWNER, VET_USER))),
            rules(before, after, actorId = ADMIN),
        )
    }

    @Test
    fun `completion includes confirmed services without a duplicate services alert`() {
        val before = appointment(AppointmentStatus.CONFIRMED)
        val after = before.copy(
            status = AppointmentStatus.COMPLETED,
            services = before.services.map { it.copy(isPerformed = true) })

        assertEquals(
            listOf(NotificationTarget(NotificationType.APPOINTMENT_COMPLETED, setOf(OWNER))),
            rules(before, after, actorId = VET_USER),
        )
    }

    @Test
    fun `service order and audit metadata changes alone do not produce alerts`() {
        val before = appointment()
        val after =
            before.copy(services = before.services.map { it.copy(updatedBy = ADMIN, updatedAt = Instant.now()) })

        assertTrue(rules(before, after, actorId = ADMIN).isEmpty())
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
            services = listOf(AppointmentService(UUID.randomUUID(), "Visit", 1500.0, 30, 0)),
            followUpOf = followUpOf,
            startAt = startAt,
            endAt = startAt + Duration.ofMinutes(30),
            status = status,
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
