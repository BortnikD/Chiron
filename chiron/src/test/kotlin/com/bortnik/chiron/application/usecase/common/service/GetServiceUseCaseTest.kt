package com.bortnik.chiron.application.usecase.common.service

import com.bortnik.chiron.domain.dto.service.ServiceFilter
import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNull

class GetServiceUseCaseTest {

    private val services = mock(ServiceRepository::class.java)
    private val species = mock(ServiceSpeciesRepository::class.java)
    private val useCase = GetServiceUseCase(services, species)

    @Test
    fun `catalogue without species preserves base values and does not load overrides`() {
        val service = service()
        `when`(services.findAll(ServiceFilter(isActive = true))).thenReturn(listOf(service))

        val response = useCase.findAllActive(ServiceFilter()).single().toResponse()

        assertEquals(service.basePrice, response.basePrice)
        assertEquals(service.baseDurationMin, response.baseDurationMin)
        assertNull(response.effectivePrice)
        assertNull(response.effectiveDurationMin)
        verify(services).findAll(ServiceFilter(isActive = true))
        verifyNoMoreInteractions(services)
        verifyNoInteractions(species)
    }

    @Test
    fun `species overrides fall back independently and are loaded once for the whole catalogue`() {
        val speciesId = UUID.randomUUID()
        val specializationId = UUID.randomUUID()
        val filter = ServiceFilter(specializationId, speciesId, isActive = true)
        val catalogue = List(4) { service().copy(specializationId = specializationId) }
        `when`(services.findAll(filter)).thenReturn(catalogue)
        `when`(species.findAllBySpeciesId(speciesId)).thenReturn(
            listOf(
                ServiceSpecies(catalogue[0].id, speciesId, durationMin = 45, price = 1500.0),
                ServiceSpecies(catalogue[1].id, speciesId, price = 0.0),
                ServiceSpecies(catalogue[2].id, speciesId, durationMin = 20),
                ServiceSpecies(catalogue[3].id, speciesId),
            ),
        )

        val responses = useCase.findAllActive(filter.copy(isActive = false)).map { it.toResponse() }

        assertEquals(catalogue.map { it.id }, responses.map { it.id })
        assertEquals(listOf(1500.0, 0.0, 1000.0, 1000.0), responses.map { it.effectivePrice })
        assertEquals(listOf(45, 30, 20, 30), responses.map { it.effectiveDurationMin })
        assertEquals(List(4) { 1000.0 }, responses.map { it.basePrice })
        assertEquals(List(4) { 30 }, responses.map { it.baseDurationMin })
        assertEquals(List(4) { 10 }, responses.map { it.bufferAfterMin })
        verify(services).findAll(filter)
        verify(species).findAllBySpeciesId(speciesId)
        verifyNoMoreInteractions(services, species)
    }

    @Test
    fun `empty species catalogue does not query overrides`() {
        val filter = ServiceFilter(speciesId = UUID.randomUUID(), isActive = true)
        `when`(services.findAll(filter)).thenReturn(emptyList())

        assertEquals(emptyList(), useCase.findAllActive(filter))

        verify(services).findAll(filter)
        verifyNoMoreInteractions(services)
        verifyNoInteractions(species)
    }

    private fun service() = Service(
        id = UUID.randomUUID(),
        specializationId = UUID.randomUUID(),
        name = "Examination",
        description = "General examination",
        basePrice = 1000.0,
        baseDurationMin = 30,
        bufferAfterMin = 10,
        createdAt = Instant.parse("2026-11-01T10:00:00Z"),
        updatedAt = Instant.parse("2026-11-01T10:00:00Z"),
    )
}
