package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentDeletionNotAllowedException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.support.TestEntities.appointment
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertFailsWith

class AdminDeleteAppointmentUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val useCase = AdminDeleteAppointmentUseCase(appointments)
    private val actor = Actor(UUID.randomUUID(), UserRole.ADMIN, "Admin")

    @Test
    fun `only cancelled appointments can be deleted`() {
        for (status in AppointmentStatus.entries.filter { it != AppointmentStatus.CANCELLED }) {
            `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(status = status))
            assertFailsWith<AppointmentDeletionNotAllowedException> { useCase.delete(actor, appointment.id) }
        }
        verify(appointments, never()).deleteById(appointment.id)

        `when`(appointments.findById(appointment.id)).thenReturn(appointment.copy(status = AppointmentStatus.CANCELLED))
        `when`(appointments.deleteById(appointment.id)).thenReturn(true)
        useCase.delete(actor, appointment.id)
        verify(appointments).deleteById(appointment.id)
    }

    @Test
    fun `unknown appointment returns not found without deleting anything`() {
        assertFailsWith<AppointmentNotFoundException> { useCase.delete(actor, appointment.id) }
        verify(appointments, never()).deleteById(appointment.id)
    }
}
