package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class CheckAppointmentAvailabilityUseCaseTest {
    private val schedules = mock(WorkScheduleRepository::class.java)
    private val exceptions = mock(ScheduleExceptionRepository::class.java)
    private val appointments = mock(AppointmentRepository::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase = CheckAppointmentAvailabilityUseCase(schedules, exceptions, appointments, clinic)
    private val veterinarianId = UUID.randomUUID()
    private val start = Instant.parse("2026-11-08T06:00:00Z")
    private val end = start.plusSeconds(3600)
    private val date = LocalDate.parse("2026-11-08")

    @Test
    fun `empty and reversed intervals are rejected before loading appointments`() {
        for (endAt in listOf(start, start.minusSeconds(3600))) {
            val ex = assertFailsWith<ValidationException> { useCase.check(veterinarianId, start, endAt) }
            assertEquals(listOf("endAt"), ex.errors.map { it.field })
        }
        verifyNoInteractions(schedules, exceptions, appointments)
    }

    @Test
    fun `single slot check loads only overlapping appointments and exceptions`() {
        val filter = ScheduleExceptionFilter(veterinarianId = veterinarianId, from = date, to = date)
        `when`(schedules.findAllByVeterinarianId(veterinarianId)).thenReturn(
            listOf(
                WorkSchedule(
                    UUID.randomUUID(),
                    veterinarianId,
                    date.dayOfWeek,
                    LocalTime.of(9, 0),
                    LocalTime.of(18, 0),
                ),
            ),
        )
        `when`(exceptions.findAll(filter)).thenReturn(emptyList())
        `when`(appointments.findOverlapping(veterinarianId, start, end)).thenReturn(emptyList())

        useCase.check(veterinarianId, start, end)

        verify(schedules).findAllByVeterinarianId(veterinarianId)
        verify(exceptions).findAll(filter)
        verify(appointments).findOverlapping(veterinarianId, start, end)
        verifyNoMoreInteractions(schedules, exceptions, appointments)
    }

    @Test
    fun `search period loads exceptions using clinic dates across utc midnight`() {
        val from = Instant.parse("2026-11-07T21:00:00Z")
        val to = Instant.parse("2026-11-09T21:00:00Z")

        useCase.availabilityOf(veterinarianId, from, to)

        verify(exceptions).findAll(
            ScheduleExceptionFilter(
                veterinarianId = veterinarianId, from = date, to = date.plusDays(2),
            ),
        )
        verify(appointments).findOverlapping(veterinarianId, from, to)
    }
}
