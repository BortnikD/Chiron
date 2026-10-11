package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class VeterinarianAvailabilityTest {

    @Test
    fun `free slots cover working hours on the slot grid`() {
        val availability = availability(schedules = listOf(schedule("09:00", "10:00")))

        val starts = availability.freeSlotStarts(DATE, Duration.ofMinutes(30))

        assertEquals(times("09:00", "09:15", "09:30"), starts)
    }

    @Test
    fun `slots overlapping the break are skipped`() {
        val availability = availability(
            schedules = listOf(schedule("09:00", "11:00", breakStart = "10:00", breakEnd = "10:15")),
        )

        val starts = availability.freeSlotStarts(DATE, Duration.ofMinutes(30))

        assertEquals(times("09:00", "09:15", "09:30", "10:15", "10:30"), starts)
    }

    @Test
    fun `slots overlapping a booked appointment are skipped while cancelled ones are ignored`() {
        val booked = availability(
            schedules = listOf(schedule("09:00", "10:00")),
            appointments = listOf(appointment("09:15", "09:45", AppointmentStatus.CONFIRMED)),
        )
        val cancelled = availability(
            schedules = listOf(schedule("09:00", "10:00")),
            appointments = listOf(appointment("09:15", "09:45", AppointmentStatus.CANCELLED)),
        )

        assertEquals(times("09:00", "09:45"), booked.freeSlotStarts(DATE, Duration.ofMinutes(15)))
        assertEquals(
            times("09:00", "09:15", "09:30", "09:45"),
            cancelled.freeSlotStarts(DATE, Duration.ofMinutes(15)),
        )
    }

    @Test
    fun `absence leaves no free slots`() {
        val availability = availability(
            schedules = listOf(schedule("09:00", "10:00")),
            exceptions = listOf(exception(ScheduleExceptionType.ABSENCE)),
        )

        assertTrue(availability.freeSlotStarts(DATE, Duration.ofMinutes(15)).isEmpty())
    }

    @Test
    fun `custom hours replace the weekly schedule`() {
        val availability = availability(
            schedules = listOf(schedule("09:00", "18:00")),
            exceptions = listOf(exception(ScheduleExceptionType.CUSTOM_HOURS, "12:00", "12:30")),
        )

        assertEquals(times("12:00", "12:15"), availability.freeSlotStarts(DATE, Duration.ofMinutes(15)))
    }

    @Test
    fun `slot off the grid is unavailable`() {
        val availability = availability(schedules = listOf(schedule("09:00", "10:00")))
        val start = at("09:10")

        assertNotNull(availability.unavailabilityReason(start, start + Duration.ofMinutes(15)))
    }

    private companion object {
        val DATE: LocalDate = LocalDate.parse("2026-10-12")
        val VETERINARIAN_ID: UUID = UUID.randomUUID()
        val CREATED_AT: Instant = Instant.parse("2026-01-01T00:00:00Z")

        fun availability(
            schedules: List<WorkSchedule> = emptyList(),
            exceptions: List<ScheduleException> = emptyList(),
            appointments: List<Appointment> = emptyList(),
        ) = VeterinarianAvailability(schedules, exceptions, appointments, ZoneOffset.UTC, slotStepMin = 15)

        fun at(time: String): Instant = DATE.atTime(LocalTime.parse(time)).toInstant(ZoneOffset.UTC)

        fun times(vararg times: String): List<Instant> = times.map { at(it) }

        fun schedule(start: String, end: String, breakStart: String? = null, breakEnd: String? = null) =
            WorkSchedule(
                id = UUID.randomUUID(),
                veterinarianId = VETERINARIAN_ID,
                dayOfWeek = DATE.dayOfWeek,
                startTime = LocalTime.parse(start),
                endTime = LocalTime.parse(end),
                breakStart = breakStart?.let { LocalTime.parse(it) },
                breakEnd = breakEnd?.let { LocalTime.parse(it) },
            )

        fun exception(type: ScheduleExceptionType, start: String? = null, end: String? = null) = ScheduleException(
            id = UUID.randomUUID(),
            veterinarianId = VETERINARIAN_ID,
            type = type,
            startDate = DATE,
            endDate = DATE,
            startTime = start?.let { LocalTime.parse(it) },
            endTime = end?.let { LocalTime.parse(it) },
        )

        fun appointment(start: String, end: String, status: AppointmentStatus) = Appointment(
            id = UUID.randomUUID(),
            veterinarianId = VETERINARIAN_ID,
            petId = UUID.randomUUID(),
            serviceId = UUID.randomUUID(),
            startAt = at(start),
            endAt = at(end),
            status = status,
            priceSnapshot = 0.0,
            createdAt = CREATED_AT,
            updatedAt = CREATED_AT,
        )
    }
}
