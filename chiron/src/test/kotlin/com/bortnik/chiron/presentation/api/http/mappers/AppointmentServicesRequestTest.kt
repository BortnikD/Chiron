package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.application.usecase.common.appointment.FindAvailableSlotsUseCase
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.utils.ValidationConstants.AppointmentRules
import com.bortnik.chiron.presentation.api.http.controllers.common.AppointmentAvailabilityController
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianCreateFollowUpRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianUpdateAppointmentRequest
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.appointmentService
import jakarta.validation.Validation
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.openapitools.jackson.nullable.JsonNullableJackson3Module
import tools.jackson.databind.exc.InvalidNullException
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AppointmentServicesRequestTest {
    private val json = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(JsonNullableJackson3Module())
        .build()
    private val ids = listOf(appointmentService.serviceId, UUID(0, 99))

    @Test
    fun `all appointment request mappers preserve complete service selections`() {
        val client = ClientCreateAppointmentRequest(
            appointment.veterinarianId, appointment.petId, ids, appointment.startAt, appointment.endAt,
        )
        val admin = CreateAppointmentRequest(
            appointment.veterinarianId,
            appointment.petId,
            ids,
            startAt = appointment.startAt,
            endAt = appointment.endAt,
        )
        val followUp = VeterinarianCreateFollowUpRequest(ids, appointment.startAt, appointment.endAt)
        assertEquals(ids, client.toDto().serviceIds)
        assertEquals(ids, admin.toDto().serviceIds)
        assertEquals(ids, followUp.toDto().serviceIds)
        assertEquals(ids, UpdateAppointmentRequest(serviceIds = ids).toDto().serviceIds)
        assertEquals(ids, VeterinarianUpdateAppointmentRequest(serviceIds = ids).toDto().serviceIds)
        assertEquals(ids, UpdateAppointmentRequest(performedServiceIds = ids).toDto().performedServiceIds)
        assertEquals(
            emptyList(),
            VeterinarianUpdateAppointmentRequest(performedServiceIds = emptyList()).toDto().performedServiceIds
        )
    }

    @Test
    fun `JSON null service elements are rejected before mapping for every role`() {
        val invalidIds = listOf(ids.first().toString(), null)
        val booking = mapOf(
            "veterinarianId" to appointment.veterinarianId.toString(),
            "petId" to appointment.petId.toString(),
            "serviceIds" to invalidIds,
            "startAt" to appointment.startAt.toString(),
            "endAt" to appointment.endAt.toString(),
        )
        val cases = listOf(
            Triple(ClientCreateAppointmentRequest::class.java, booking, "serviceIds"),
            Triple(CreateAppointmentRequest::class.java, booking, "serviceIds"),
            Triple(VeterinarianCreateFollowUpRequest::class.java, booking - "veterinarianId" - "petId", "serviceIds"),
            Triple(UpdateAppointmentRequest::class.java, mapOf("serviceIds" to invalidIds), "serviceIds"),
            Triple(VeterinarianUpdateAppointmentRequest::class.java, mapOf("serviceIds" to invalidIds), "serviceIds"),
            Triple(
                UpdateAppointmentRequest::class.java,
                mapOf("performedServiceIds" to invalidIds),
                "performedServiceIds"
            ),
            Triple(
                VeterinarianUpdateAppointmentRequest::class.java,
                mapOf("performedServiceIds" to invalidIds),
                "performedServiceIds"
            ),
        )
        for ((type, body, _) in cases) {
            assertFailsWith<InvalidNullException>(type.simpleName) {
                json.readValue(json.writeValueAsString(body), type)
            }
        }
    }

    @Test
    fun `type erased null service elements violate bean validation constraints`() {
        @Suppress("UNCHECKED_CAST")
        val invalidIds = listOf(ids.first(), null) as List<UUID>
        val requests = listOf(
            ClientCreateAppointmentRequest(
                appointment.veterinarianId,
                appointment.petId,
                invalidIds,
                appointment.startAt,
                appointment.endAt
            ),
            CreateAppointmentRequest(
                appointment.veterinarianId,
                appointment.petId,
                invalidIds,
                startAt = appointment.startAt,
                endAt = appointment.endAt
            ),
            VeterinarianCreateFollowUpRequest(invalidIds, appointment.startAt, appointment.endAt),
            UpdateAppointmentRequest(serviceIds = invalidIds),
            UpdateAppointmentRequest(performedServiceIds = invalidIds),
            VeterinarianUpdateAppointmentRequest(serviceIds = invalidIds),
            VeterinarianUpdateAppointmentRequest(performedServiceIds = invalidIds),
        )
        Validation.buildDefaultValidatorFactory().use { factory ->
            for (request in requests) {
                assertTrue(
                    factory.validator.validate(request).any { it.invalidValue == null },
                    request.javaClass.simpleName
                )
            }
        }
    }

    @Test
    fun `planned selections require services while actual selections allow an empty set and both are bounded`() {
        Validation.buildDefaultValidatorFactory().use { factory ->
            for (size in listOf(0, AppointmentRules.MAX_SERVICES, AppointmentRules.MAX_SERVICES + 1)) {
                val selected = (1..size).map { UUID(0, it.toLong()) }
                val planned = UpdateAppointmentRequest(serviceIds = selected)
                val actual = VeterinarianUpdateAppointmentRequest(performedServiceIds = selected)
                assertEquals(
                    size !in 1..AppointmentRules.MAX_SERVICES,
                    factory.validator.validate(planned).isNotEmpty()
                )
                assertEquals(size > AppointmentRules.MAX_SERVICES, factory.validator.validate(actual).isNotEmpty())
            }
        }
    }

    @Test
    fun `slot query service elements have runtime method validation constraints`() {
        val controller = AppointmentAvailabilityController(
            mock(CheckAppointmentAvailabilityUseCase::class.java), mock(FindAvailableSlotsUseCase::class.java),
        )
        val method = AppointmentAvailabilityController::class.java.getMethod(
            "findAvailableSlots", UUID::class.java, List::class.java, UUID::class.java,
            LocalDate::class.java, LocalDate::class.java,
        )
        val date = LocalDate.of(2026, 11, 17)
        Validation.buildDefaultValidatorFactory().use { factory ->
            val errors = factory.validator.forExecutables().validateParameters(
                controller, method, arrayOf(UUID(0, 1), listOf(ids.first(), null), null, date, date),
            )
            assertTrue(errors.any { it.invalidValue == null })
        }
    }

    @Test
    fun `response includes all service snapshots and separates planned and actual totals`() {
        val planned = appointmentService.copy(isPerformed = true)
        val additional = appointmentService.copy(
            serviceId = ids.last(), nameSnapshot = "Additional", priceSnapshot = 50.0,
            durationMinSnapshot = 20, bufferAfterMinSnapshot = 10, isPlanned = false, isPerformed = true,
        )
        val response =
            appointment.copy(status = AppointmentStatus.COMPLETED, services = listOf(planned, additional)).toResponse()
        assertEquals(ids, response.services.map { it.serviceId })
        assertEquals(listOf(planned.nameSnapshot, "Additional"), response.services.map { it.nameSnapshot })
        assertEquals(100.0, response.estimatedTotal)
        assertEquals(150.0, response.actualTotal)
        assertEquals(30, response.durationMin)
        assertEquals(15, response.bufferAfterMin)
        val body = json.readTree(json.writeValueAsString(response))
        assertEquals(2, body["services"].size())
        assertFalse(body.has("serviceId"))
        assertFalse(body.has("priceSnapshot"))
    }
}
