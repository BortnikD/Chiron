package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.support.TestEntities.appointment
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SendAppointmentRemindersUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val notify = mock(NotifyAppointmentUseCase::class.java)
    private val leadTime = Duration.ofHours(3)
    private val config =
        NotificationProperties(NotificationProperties.Reminder(leadTime), NotificationProperties.VaccinationDue(7))
    private val useCase = SendAppointmentRemindersUseCase(appointments, notify, config)

    @Test
    fun `scheduler queries only pending and confirmed appointments in the lead window and counts new reminders`() {
        val pending = appointment.copy(id = UUID.randomUUID(), status = AppointmentStatus.PENDING)
        `when`(appointments.findAll(any(AppointmentFilter::class.java) ?: AppointmentFilter())).thenReturn(
            listOf(
                appointment,
                pending
            )
        )
        `when`(notify.remind(appointment)).thenReturn(true, false)
        `when`(notify.remind(pending)).thenReturn(false)
        val before = Instant.now()
        assertEquals(1, useCase.send())
        assertEquals(0, useCase.send())
        val after = Instant.now()
        val captor = ArgumentCaptor.forClass(AppointmentFilter::class.java)
        verify(appointments, times(2)).findAll(captor.capture() ?: AppointmentFilter())
        for (filter in captor.allValues) {
            val from = requireNotNull(filter.from)
            assertTrue(from >= before && from <= after)
            assertEquals(
                AppointmentFilter(
                    statuses = setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                    from = from,
                    to = from + leadTime
                ), filter
            )
        }
        verify(notify, times(2)).remind(appointment)
        verify(notify, times(2)).remind(pending)
    }

    @Test
    fun `empty window returns zero without sending anything`() {
        assertEquals(0, useCase.send())
        verifyNoInteractions(notify)
    }
}
