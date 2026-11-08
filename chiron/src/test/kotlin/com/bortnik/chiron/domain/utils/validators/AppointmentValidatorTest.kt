package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.support.TestEntities.appointment
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AppointmentValidatorTest {

    @Test
    fun `cancelled status requires both cancellation actor and time`() {
        for (dto in listOf(
            UpdateAppointmentDto(status = AppointmentStatus.CANCELLED),
            UpdateAppointmentDto(status = AppointmentStatus.CANCELLED, cancelledBy = Patch.Value(appointment.petId)),
            UpdateAppointmentDto(status = AppointmentStatus.CANCELLED, cancelledAt = Patch.Value(NOW)),
        )) assertFailsWith<ValidationException> { AppointmentValidator.validate(appointment, dto) }
        AppointmentValidator.validate(
            appointment, UpdateAppointmentDto(
                status = AppointmentStatus.CANCELLED,
                cancelledBy = Patch.Value(appointment.petId),
                cancelledAt = Patch.Value(NOW),
            )
        )
    }

    @Test
    fun `non cancelled appointment rejects any cancellation field`() {
        for (dto in listOf(
            UpdateAppointmentDto(cancelledBy = Patch.Value(appointment.petId)),
            UpdateAppointmentDto(cancelledAt = Patch.Value(NOW)),
            UpdateAppointmentDto(cancelReason = Patch.Value("Reason")),
        )) assertFailsWith<ValidationException> { AppointmentValidator.validate(appointment, dto) }
    }

    @Test
    fun `partial time update is validated against the retained bound`() {
        assertFailsWith<ValidationException> {
            AppointmentValidator.validate(appointment, UpdateAppointmentDto(startAt = appointment.endAt))
        }
        assertFailsWith<ValidationException> {
            AppointmentValidator.validate(appointment, UpdateAppointmentDto(endAt = appointment.startAt))
        }
    }

    @Test
    fun `filter without time bounds is accepted`() {
        AppointmentValidator.validate(AppointmentFilter())
    }

    @Test
    fun `filter with only one time bound is accepted`() {
        AppointmentValidator.validate(AppointmentFilter(from = NOW))
        AppointmentValidator.validate(AppointmentFilter(to = NOW))
    }

    @Test
    fun `filter with to not after from is rejected`() {
        val ex = assertFailsWith<ValidationException> {
            AppointmentValidator.validate(AppointmentFilter(from = NOW, to = NOW))
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    @Test
    fun `slot search of exactly the maximum number of days is accepted`() {
        AppointmentValidator.validate(slotFilter(from = TODAY, to = TODAY.plusDays(13)))
    }

    @Test
    fun `slot search longer than the maximum number of days is rejected`() {
        val ex = assertFailsWith<ValidationException> {
            AppointmentValidator.validate(slotFilter(from = TODAY, to = TODAY.plusDays(14)))
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    @Test
    fun `slot search with to before from is rejected`() {
        val ex = assertFailsWith<ValidationException> {
            AppointmentValidator.validate(slotFilter(from = TODAY, to = TODAY.minusDays(1)))
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    private fun slotFilter(from: LocalDate, to: LocalDate) =
        AvailableSlotFilter(speciesId = UUID.randomUUID(), serviceId = UUID.randomUUID(), from = from, to = to)

    private companion object {
        val NOW: Instant = Instant.parse("2026-09-25T10:00:00Z")
        val TODAY: LocalDate = LocalDate.parse("2026-09-25")
    }
}
