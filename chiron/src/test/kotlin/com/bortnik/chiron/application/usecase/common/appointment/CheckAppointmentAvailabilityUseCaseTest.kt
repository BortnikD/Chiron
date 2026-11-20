package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.appointment.AppointmentInterval
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.infrastructure.persistence.exceptions.ConcurrencyException
import com.bortnik.chiron.infrastructure.persistence.exceptions.SqlError
import com.bortnik.chiron.presentation.api.http.controllers.common.AppointmentAvailabilityController
import com.bortnik.chiron.presentation.api.http.exceptions.DomainExceptionHandler
import com.bortnik.chiron.presentation.api.http.exceptions.GlobalExceptionHandler
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
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
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase =
        CheckAppointmentAvailabilityUseCase(schedules, exceptions, appointments, clinic, veterinarians)
    private val veterinarianId = veterinarian.id
    private val start = Instant.parse("2026-11-08T06:00:00Z")
    private val end = start.plusSeconds(3600)
    private val date = LocalDate.parse("2026-11-08")

    @Test
    fun `empty and reversed intervals are rejected before loading appointments`() {
        for (endAt in listOf(start, start.minusSeconds(3600))) {
            val ex = assertFailsWith<ValidationException> { useCase.check(veterinarianId, start, endAt) }
            assertEquals(listOf("endAt"), ex.errors.map { it.field })
        }
        verifyNoInteractions(veterinarians, schedules, exceptions, appointments)
    }

    @Test
    fun `single slot check loads only overlapping appointments and exceptions`() {
        `when`(veterinarians.findById(veterinarianId)).thenReturn(veterinarian)
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
        `when`(appointments.findOverlappingIntervals(veterinarianId, start, end)).thenReturn(emptyList())

        useCase.check(veterinarianId, start, end)

        verify(schedules).findAllByVeterinarianId(veterinarianId)
        verify(exceptions).findAll(filter)
        verify(appointments).findOverlappingIntervals(veterinarianId, start, end)
        verifyNoMoreInteractions(schedules, exceptions, appointments)
    }

    @Test
    fun `availability reports missing inactive and busy veterinarians distinctly`() {
        val mvc = MockMvcBuilders.standaloneSetup(
            AppointmentAvailabilityController(useCase, mock(FindAvailableSlotsUseCase::class.java)),
        ).setControllerAdvice(DomainExceptionHandler(), GlobalExceptionHandler()).build()
        val json = JsonMapper.builder().build()
        fun assertError(status: Int, name: String) {
            val response = mvc.perform(
                get("/api/v1/appointments/availability")
                    .param("veterinarianId", veterinarianId.toString())
                    .param("startAt", start.toString())
                    .param("endAt", end.toString()),
            ).andReturn().response
            assertEquals(status, response.status)
            assertEquals(name, json.readTree(response.contentAsString)["error"]["name"].asString())
        }

        assertError(404, "VeterinarianNotFoundException")
        `when`(veterinarians.findById(veterinarianId)).thenReturn(veterinarian.copy(isActive = false))
        assertError(422, "VeterinarianInactiveException")
        verifyNoInteractions(schedules, exceptions, appointments)

        `when`(veterinarians.findById(veterinarianId)).thenReturn(veterinarian)
        assertError(422, "AppointmentSlotUnavailableException")
        `when`(schedules.findAllByVeterinarianId(veterinarianId)).thenReturn(
            listOf(
                WorkSchedule(
                    UUID.randomUUID(),
                    veterinarianId,
                    date.dayOfWeek,
                    LocalTime.of(9, 0),
                    LocalTime.of(18, 0)
                )
            ),
        )
        `when`(appointments.findOverlappingIntervals(veterinarianId, start, end)).thenReturn(
            listOf(AppointmentInterval(UUID.randomUUID(), start, end, AppointmentStatus.CONFIRMED)),
        )
        assertError(409, "AppointmentSlotConflictException")

        `when`(appointments.findOverlappingIntervals(veterinarianId, start, end)).thenThrow(
            ConcurrencyException(SqlError.EXCLUSION_VIOLATION, "23P01", "Overlapping appointment intervals"),
        )
        assertError(409, "AppointmentSlotConflictException")
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
        verify(appointments).findOverlappingIntervals(veterinarianId, from, to)
    }
}
