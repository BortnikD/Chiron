package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.appointmentService
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

class AppointmentTest {
    @Test
    fun `duration sums planned procedures and uses only the largest buffer`() {
        val other = appointmentService.copy(
            serviceId = UUID.randomUUID(), durationMinSnapshot = 20, bufferAfterMinSnapshot = 10,
        )
        val result = appointment.copy(services = listOf(appointmentService, other))

        assertEquals(50, result.durationMin)
        assertEquals(15, result.bufferAfterMin)
    }

    @Test
    fun `performed extras affect actual total without changing the plan or reserved interval`() {
        val planned = appointmentService.copy(priceSnapshot = 0.1, isPerformed = true)
        val skipped = appointmentService.copy(serviceId = UUID.randomUUID(), priceSnapshot = 40.0, isPerformed = false)
        val extra = appointmentService.copy(
            serviceId = UUID.randomUUID(), priceSnapshot = 0.2, isPlanned = false, isPerformed = true,
        )
        val result = appointment.copy(status = AppointmentStatus.COMPLETED, services = listOf(planned, skipped, extra))

        assertEquals(40.1, result.estimatedTotal)
        assertEquals(0.3, result.actualTotal)
        assertEquals(60, result.durationMin)
        assertEquals(15, result.bufferAfterMin)
        assertEquals(appointment.startAt, result.startAt)
        assertEquals(appointment.endAt, result.endAt)
    }

    @Test
    fun `actual total remains unavailable until completion`() {
        assertNull(appointment.copy(services = listOf(appointmentService.copy(isPerformed = true))).actualTotal)
    }

    @Test
    fun `legacy unknown duration and buffer remain unknown`() {
        val legacy = appointmentService.copy(durationMinSnapshot = null, bufferAfterMinSnapshot = null)
        val result = appointment.copy(services = listOf(legacy))

        assertNull(result.durationMin)
        assertNull(result.bufferAfterMin)
        assertEquals(appointment.endAt, result.endAt)
    }
}
