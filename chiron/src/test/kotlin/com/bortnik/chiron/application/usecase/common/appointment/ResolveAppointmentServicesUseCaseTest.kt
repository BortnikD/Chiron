package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ResolveAppointmentServicesUseCaseTest {
    private val services = mock(ServiceRepository::class.java)
    private val overrides = mock(ServiceSpeciesRepository::class.java)
    private val useCase = ResolveAppointmentServicesUseCase(services, overrides)
    private val other = service.copy(
        id = UUID.randomUUID(), name = "Vaccination", basePrice = 0.2,
        baseDurationMin = 20, bufferAfterMin = 10
    )
    private val ids = listOf(service.id, other.id)

    @Test
    fun `one batch preserves selection order uses species overrides and takes maximum buffer`() {
        `when`(services.findAllByIds(ids)).thenReturn(listOf(other, service))
        `when`(overrides.findAllBySpeciesId(pet.speciesId)).thenReturn(
            listOf(
                ServiceSpecies(service.id, pet.speciesId, durationMin = 30, price = 0.1),
                ServiceSpecies(other.id, pet.speciesId),
            )
        )

        val result = useCase.resolvePlanned(ids, pet.speciesId, pet.ownerId)

        assertEquals(ids, result.services.map { it.serviceId })
        assertEquals(listOf(service.name, other.name), result.services.map { it.nameSnapshot })
        assertEquals(50, result.durationMin)
        assertEquals(15, result.bufferAfterMin)
        assertEquals(0.3, result.estimatedTotal)
        assertEquals(listOf(pet.ownerId, pet.ownerId), result.services.map { it.addedBy })
        verify(services).findAllByIds(ids)
        verify(overrides).findAllBySpeciesId(pet.speciesId)
    }

    @Test
    fun `empty duplicate and oversized selections are rejected before database access`() {
        for (selection in listOf(emptyList(), listOf(service.id, service.id), List(21) { UUID.randomUUID() })) {
            assertFailsWith<ValidationException> { useCase.resolvePlanned(selection, pet.speciesId) }
        }
        verifyNoInteractions(services, overrides)
    }

    @Test
    fun `missing service is rejected rather than silently omitted`() {
        `when`(services.findAllByIds(ids)).thenReturn(listOf(service))
        `when`(overrides.findAllBySpeciesId(pet.speciesId)).thenReturn(
            listOf(
                ServiceSpecies(
                    service.id,
                    pet.speciesId
                )
            )
        )

        assertFailsWith<ServiceNotFoundException> { useCase.resolvePlanned(ids, pet.speciesId) }
    }

    @Test
    fun `services from different specializations cannot share one appointment plan`() {
        `when`(services.findAllByIds(ids)).thenReturn(listOf(service, other.copy(specializationId = UUID.randomUUID())))
        `when`(overrides.findAllBySpeciesId(pet.speciesId)).thenReturn(ids.map { ServiceSpecies(it, pet.speciesId) })

        val error = assertFailsWith<ValidationException> { useCase.resolvePlanned(ids, pet.speciesId) }

        assertEquals(listOf("serviceIds"), error.errors.map { it.field })
    }

    @Test
    fun `resolving services leaves aggregate scheduling limits to the planning operation`() {
        `when`(services.findAllByIds(ids)).thenReturn(
            listOf(
                service.copy(baseDurationMin = 900),
                other.copy(baseDurationMin = 600)
            )
        )
        `when`(overrides.findAllBySpeciesId(pet.speciesId)).thenReturn(ids.map { ServiceSpecies(it, pet.speciesId) })

        val result = useCase.resolvePlanned(ids, pet.speciesId)

        assertEquals(1500, result.durationMin)
        assertEquals(15, result.bufferAfterMin)
    }
}
