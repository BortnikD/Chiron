package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.pet
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.any
import org.mockito.Mockito.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class ChangeAppointmentStatusUseCaseTest {
    private val update = mock(UpdateAppointmentUseCase::class.java)
    private val useCase = ChangeAppointmentStatusUseCase(update)

    @Test
    fun `first cancellation records actor time and reason while preserving notes patch`() {
        `when`(
            update.update(
                eq(appointment.id) ?: appointment.id,
                any(UpdateAppointmentDto::class.java) ?: UpdateAppointmentDto()
            )
        )
            .thenReturn(appointment)
        val before = Instant.now()
        useCase.change(appointment, AppointmentStatus.CANCELLED, pet.ownerId, Patch.Value("Notes"), "Cannot attend")
        val after = Instant.now()
        val captor = ArgumentCaptor.forClass(UpdateAppointmentDto::class.java)
        verify(update).update(eq(appointment.id) ?: appointment.id, captor.capture() ?: UpdateAppointmentDto())
        val dto = captor.value
        val cancelledAt = assertIs<Patch.Value<Instant?>>(dto.cancelledAt).value!!
        assertTrue(cancelledAt >= before && cancelledAt <= after)
        assertEquals(
            UpdateAppointmentDto(
                status = AppointmentStatus.CANCELLED, vetNotes = Patch.Value("Notes"),
                cancelledBy = Patch.Value(pet.ownerId), cancelledAt = Patch.Value(cancelledAt),
                cancelReason = Patch.Value("Cannot attend"),
            ),
            dto,
        )
    }

    @Test
    fun `repeated cancellation leaves original metadata unchanged`() {
        val cancelled = appointment.copy(
            status = AppointmentStatus.CANCELLED, cancelledBy = pet.ownerId,
            cancelledAt = appointment.startAt, cancelReason = "Original reason",
        )
        val expected = UpdateAppointmentDto(status = AppointmentStatus.CANCELLED)
        `when`(update.update(appointment.id, expected)).thenReturn(cancelled)
        assertEquals(
            cancelled,
            useCase.change(
                cancelled,
                AppointmentStatus.CANCELLED,
                appointment.veterinarianId,
                Patch.Unchanged,
                "Other reason"
            )
        )
        verify(update).update(appointment.id, expected)
    }

    @Test
    fun `non cancellation status forwards notes without cancellation metadata`() {
        val expected = UpdateAppointmentDto(status = AppointmentStatus.COMPLETED, vetNotes = Patch.Value(null))
        `when`(update.update(appointment.id, expected)).thenReturn(appointment)
        useCase.change(appointment, AppointmentStatus.COMPLETED, pet.ownerId, Patch.Value(null), null)
        verify(update).update(appointment.id, expected)
    }
}
