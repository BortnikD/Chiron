package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.user
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class NotifyScheduleConflictsUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val users = mock(UserRepository::class.java)
    private val schedules = mock(WorkScheduleRepository::class.java)
    private val exceptions = mock(ScheduleExceptionRepository::class.java)
    private val notify = mock(NotifyAppointmentUseCase::class.java)
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val useCase = NotifyScheduleConflictsUseCase(
        appointments, veterinarians, users,
        CheckAppointmentAvailabilityUseCase(schedules, exceptions, appointments, clinic, veterinarians),
        notify, Clock.fixed(now, clinic.zoneId),
    )
    private val day = appointment.startAt.atZone(clinic.zoneId).toLocalDate()
    private val schedule = WorkSchedule(UUID.randomUUID(), veterinarian.id, day.dayOfWeek, LocalTime.MIN, LocalTime.MAX)
    private val exceptionFilter = ScheduleExceptionFilter(veterinarianId = veterinarian.id, from = day, to = day)
    private val absence = ScheduleException(UUID.randomUUID(), veterinarian.id, ScheduleExceptionType.ABSENCE, day, day)
    private val admin = user.copy(id = UUID.randomUUID(), role = UserRole.ADMIN)
    private val adminFilter = UserFilter(role = UserRole.ADMIN)
    private val filter = AppointmentFilter(
        veterinarianId = veterinarian.id,
        statuses = setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
        from = now,
    )

    @BeforeEach
    fun prepare() {
        `when`(appointments.findAll(filter)).thenReturn(listOf(appointment))
        `when`(appointments.findOverlapping(veterinarian.id, appointment.startAt, appointment.endAt))
            .thenReturn(listOf(appointment))
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(schedules.findAllByVeterinarianId(veterinarian.id)).thenReturn(listOf(schedule))
        `when`(exceptions.findAll(exceptionFilter)).thenReturn(emptyList())
        `when`(users.findAll(adminFilter, PageRequest(0, 100))).thenReturn(Page(listOf(admin), 0, 100, 1))
    }

    @Test
    fun `absence warns every administrator including the actor across all pages`() {
        val before = useCase.conflictingIds(veterinarian.id)
        assertTrue(before.isEmpty())
        val secondAdmin = admin.copy(id = UUID.randomUUID())
        `when`(users.findAll(adminFilter, PageRequest(0, 100))).thenReturn(Page(listOf(admin), 0, 100, 101))
        `when`(users.findAll(adminFilter, PageRequest(1, 100))).thenReturn(Page(listOf(secondAdmin), 1, 100, 101))
        `when`(exceptions.findAll(exceptionFilter)).thenReturn(listOf(absence))

        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)

        verify(notify).notifyScheduleConflict(admin.id, appointment, setOf(admin.id, secondAdmin.id))
        verify(appointments, times(2)).findAll(filter)
    }

    @Test
    fun `unchanged conflict and restored availability do not repeat warnings`() {
        `when`(exceptions.findAll(exceptionFilter)).thenReturn(listOf(absence))
        val before = useCase.conflictingIds(veterinarian.id)
        assertEquals(setOf(appointment.id), before)
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)
        `when`(exceptions.findAll(exceptionFilter)).thenReturn(emptyList())
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)
        verifyNoInteractions(notify, users)
    }

    @Test
    fun `custom hours and breaks use the same availability rules as booking`() {
        val before = useCase.conflictingIds(veterinarian.id)
        val start = appointment.startAt.atZone(clinic.zoneId).toLocalTime()
        `when`(exceptions.findAll(exceptionFilter)).thenReturn(
            listOf(
                absence.copy(
                    type = ScheduleExceptionType.CUSTOM_HOURS,
                    startTime = start.plusHours(1),
                    endTime = LocalTime.MAX
                )
            ),
        )
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)

        `when`(exceptions.findAll(exceptionFilter)).thenReturn(emptyList())
        `when`(schedules.findAllByVeterinarianId(veterinarian.id)).thenReturn(
            listOf(schedule.copy(breakStart = start, breakEnd = start.plusHours(1))),
        )
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)
        verify(notify, times(2)).notifyScheduleConflict(admin.id, appointment, setOf(admin.id))
    }

    @Test
    fun `removing working hours or deactivating veterinarian warns about future appointments`() {
        val before = useCase.conflictingIds(veterinarian.id)
        `when`(schedules.findAllByVeterinarianId(veterinarian.id)).thenReturn(emptyList())
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)

        `when`(schedules.findAllByVeterinarianId(veterinarian.id)).thenReturn(listOf(schedule))
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian.copy(isActive = false))
        useCase.notifyNewConflicts(admin.id, veterinarian.id, before)
        verify(notify, times(2)).notifyScheduleConflict(admin.id, appointment, setOf(admin.id))
    }

    @Test
    fun `unknown veterinarian is rejected before querying appointments`() {
        val unknownId = UUID.randomUUID()
        assertFailsWith<VeterinarianNotFoundException> { useCase.conflictingIds(unknownId) }
        assertFailsWith<VeterinarianNotFoundException> {
            useCase.notifyNewConflicts(admin.id, unknownId, emptySet())
        }
        verifyNoInteractions(appointments, schedules, exceptions, notify, users)
    }

    @Test
    fun `no future pending or confirmed appointments produces no warnings`() {
        `when`(appointments.findAll(filter)).thenReturn(emptyList())
        assertTrue(useCase.conflictingIds(veterinarian.id).isEmpty())
        useCase.notifyNewConflicts(admin.id, veterinarian.id, emptySet())
        verify(veterinarians, times(2)).findById(veterinarian.id)
        verifyNoInteractions(schedules, exceptions, notify, users)
    }
}
