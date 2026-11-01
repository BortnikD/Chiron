package com.bortnik.chiron.application.usecase.client.summary

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.GetOwnNotificationsUseCase
import com.bortnik.chiron.domain.dto.client.ClientAppointmentTotalsDto
import com.bortnik.chiron.domain.dto.client.ClientVaccinationTotalsDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.ClientSummaryRepository
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.presentation.api.http.controllers.client.ClientSummaryController
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ClientGetSummaryUseCaseTest {

    private val actor = Actor(UUID.randomUUID(), UserRole.CLIENT, "Client")
    private val summaryRepository = mock(ClientSummaryRepository::class.java)
    private val notifications = mock(NotificationRepository::class.java)
    private val clock = mock(Clock::class.java)
    private val now = Instant.parse("2026-11-01T21:30:00Z")
    private val today = LocalDate.of(2026, 11, 2)
    private val useCase = useCase(7)

    @Test
    fun `empty dashboard returns zero totals and no next appointment`() {
        stubEmptyDashboard(actor, today.plusDays(7))

        val result = useCase.get(actor)

        assertEquals(0L, result.activePets)
        assertEquals(0L, result.upcomingAppointments)
        assertEquals(0L, result.completedAppointments)
        assertEquals(0L, result.vaccinationsDue)
        assertEquals(0L, result.vaccinationsOverdue)
        assertEquals(0L, result.unreadNotifications)
        assertNull(result.nextAppointment)
        verifyQueries(actor, today.plusDays(7))
    }

    @Test
    fun `dashboard response includes all totals and uses the existing appointment response`() {
        val appointment = appointment()
        stubEmptyDashboard(actor, today.plusDays(7))
        `when`(summaryRepository.countActivePets(actor.userId)).thenReturn(2)
        `when`(summaryRepository.countAppointments(actor.userId, now)).thenReturn(ClientAppointmentTotalsDto(4, 12))
        `when`(summaryRepository.findNextAppointment(actor.userId, now)).thenReturn(appointment)
        `when`(summaryRepository.countVaccinations(actor.userId, today, today.plusDays(7)))
            .thenReturn(ClientVaccinationTotalsDto(3, 1))
        `when`(notifications.countUnread(actor.userId)).thenReturn(5)

        val response = ClientSummaryController(useCase).get(actor)
        val summary = requireNotNull(response.result)

        assertTrue(response.success)
        assertEquals(2L, summary.activePets)
        assertEquals(4L, summary.upcomingAppointments)
        assertEquals(12L, summary.completedAppointments)
        assertEquals(3L, summary.vaccinationsDue)
        assertEquals(1L, summary.vaccinationsOverdue)
        assertEquals(5L, summary.unreadNotifications)
        assertEquals(appointment.toResponse(), summary.nextAppointment)
        verifyQueries(actor, today.plusDays(7))
    }

    @Test
    fun `due horizon uses the clinic date and configured lead days`() {
        val dueTo = today.plusDays(3)
        stubEmptyDashboard(actor, dueTo)

        useCase(3).get(actor)

        verifyQueries(actor, dueTo)
    }

    @Test
    fun `notifications and archived pet appointment history remain available without active pets`() {
        stubEmptyDashboard(actor, today.plusDays(7))
        val appointment = appointment()
        `when`(summaryRepository.countAppointments(actor.userId, now)).thenReturn(ClientAppointmentTotalsDto(1, 8))
        `when`(summaryRepository.findNextAppointment(actor.userId, now)).thenReturn(appointment)
        `when`(notifications.countUnread(actor.userId)).thenReturn(2)

        val result = useCase.get(actor)

        assertEquals(0L, result.activePets)
        assertEquals(1L, result.upcomingAppointments)
        assertEquals(8L, result.completedAppointments)
        assertEquals(appointment, result.nextAppointment)
        assertEquals(2L, result.unreadNotifications)
        verifyQueries(actor, today.plusDays(7))
    }

    @Test
    fun `every query is scoped to the current client`() {
        val otherActor = actor.copy(userId = UUID.randomUUID())
        stubEmptyDashboard(otherActor, today.plusDays(7))

        useCase.get(otherActor)

        verifyQueries(otherActor, today.plusDays(7))
    }

    private fun useCase(leadDays: Long) = ClientGetSummaryUseCase(
        summaryRepository,
        GetOwnNotificationsUseCase(notifications),
        ClinicProperties("Europe/Moscow", 15),
        NotificationProperties(
            NotificationProperties.Reminder(Duration.ofHours(24)),
            NotificationProperties.VaccinationDue(leadDays),
        ),
        clock,
    )

    private fun stubEmptyDashboard(client: Actor, dueTo: LocalDate) {
        `when`(clock.instant()).thenReturn(now)
        `when`(summaryRepository.countActivePets(client.userId)).thenReturn(0)
        `when`(summaryRepository.countAppointments(client.userId, now)).thenReturn(ClientAppointmentTotalsDto())
        `when`(summaryRepository.findNextAppointment(client.userId, now)).thenReturn(null)
        `when`(summaryRepository.countVaccinations(client.userId, today, dueTo)).thenReturn(ClientVaccinationTotalsDto())
        `when`(notifications.countUnread(client.userId)).thenReturn(0)
    }

    private fun verifyQueries(client: Actor, dueTo: LocalDate) {
        verify(clock).instant()
        verify(summaryRepository).countActivePets(client.userId)
        verify(summaryRepository).countAppointments(client.userId, now)
        verify(summaryRepository).findNextAppointment(client.userId, now)
        verify(summaryRepository).countVaccinations(client.userId, today, dueTo)
        verify(notifications).countUnread(client.userId)
        verifyNoMoreInteractions(summaryRepository, notifications, clock)
    }

    private fun appointment() = Appointment(
        id = UUID.randomUUID(),
        veterinarianId = UUID.randomUUID(),
        petId = UUID.randomUUID(),
        serviceId = UUID.randomUUID(),
        startAt = now,
        endAt = now.plusSeconds(1800),
        status = AppointmentStatus.CONFIRMED,
        priceSnapshot = 1000.0,
        createdAt = now.minusSeconds(3600),
        updatedAt = now.minusSeconds(3600),
    )
}
