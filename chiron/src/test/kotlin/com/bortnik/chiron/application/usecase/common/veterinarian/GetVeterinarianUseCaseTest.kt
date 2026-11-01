package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
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
import kotlin.test.assertFailsWith

class GetVeterinarianUseCaseTest {

    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val permissions = mock(VeterinarianSpeciesPermissionRepository::class.java)
    private val useCase = GetVeterinarianUseCase(veterinarians, permissions)

    @Test
    fun `list loads species once and assigns them to the correct veterinarian`() {
        val filter = VeterinarianFilter()
        val profiles = List(3) { profile() }
        val ids = profiles.map { it.veterinarian.id }
        val firstSpecies = UUID.randomUUID()
        val secondSpecies = UUID.randomUUID()
        `when`(veterinarians.findAllDetails(filter)).thenReturn(profiles)
        `when`(permissions.findAllByVeterinarianIds(ids)).thenReturn(
            listOf(
                VeterinarianSpeciesPermission(ids[0], firstSpecies),
                VeterinarianSpeciesPermission(ids[1], secondSpecies),
                VeterinarianSpeciesPermission(ids[0], secondSpecies),
            ),
        )

        val result = useCase.findAll(filter)

        assertEquals(ids, result.map { it.veterinarian.id })
        assertEquals(listOf(firstSpecies, secondSpecies), result[0].toResponse().speciesIds)
        assertEquals(listOf(secondSpecies), result[1].toResponse().speciesIds)
        assertEquals(emptyList(), result[2].toResponse().speciesIds)
        verify(veterinarians).findAllDetails(filter)
        verify(permissions).findAllByVeterinarianIds(ids)
        verifyNoMoreInteractions(veterinarians, permissions)
    }

    @Test
    fun `species filter keeps all species of matching active veterinarians`() {
        val profile = profile()
        val speciesId = UUID.randomUUID()
        val otherSpeciesId = UUID.randomUUID()
        val filter = VeterinarianFilter(speciesId = speciesId, isActive = true)
        val id = profile.veterinarian.id
        `when`(veterinarians.findAllDetails(filter)).thenReturn(listOf(profile))
        `when`(permissions.findAllByVeterinarianIds(listOf(id))).thenReturn(
            listOf(
                VeterinarianSpeciesPermission(id, speciesId),
                VeterinarianSpeciesPermission(id, otherSpeciesId),
            ),
        )

        val result = useCase.findAllActive(filter.copy(isActive = false)).single()

        assertEquals(listOf(speciesId, otherSpeciesId), result.speciesIds)
        verify(veterinarians).findAllDetails(filter)
        verify(permissions).findAllByVeterinarianIds(listOf(id))
        verifyNoMoreInteractions(veterinarians, permissions)
    }

    @Test
    fun `empty list does not load permissions`() {
        val filter = VeterinarianFilter()
        `when`(veterinarians.findAllDetails(filter)).thenReturn(emptyList())

        assertEquals(emptyList(), useCase.findAll(filter))

        verify(veterinarians).findAllDetails(filter)
        verifyNoMoreInteractions(veterinarians)
        verifyNoInteractions(permissions)
    }

    @Test
    fun `lookup by profile id includes permitted species`() {
        val profile = profile()
        val id = profile.veterinarian.id
        val speciesId = UUID.randomUUID()
        `when`(veterinarians.findDetailsById(id)).thenReturn(profile)
        `when`(permissions.findAllByVeterinarianId(id)).thenReturn(
            listOf(VeterinarianSpeciesPermission(id, speciesId)),
        )

        assertEquals(profile.copy(speciesIds = listOf(speciesId)), useCase.findById(id))

        verify(veterinarians).findDetailsById(id)
        verify(permissions).findAllByVeterinarianId(id)
        verifyNoMoreInteractions(veterinarians, permissions)
    }

    @Test
    fun `lookup by user id returns an empty array when no permissions are assigned`() {
        val profile = profile()
        val id = profile.veterinarian.id
        val userId = profile.veterinarian.userId
        `when`(veterinarians.findDetailsByUserId(userId)).thenReturn(profile)
        `when`(permissions.findAllByVeterinarianId(id)).thenReturn(emptyList())

        assertEquals(emptyList(), useCase.findByUserId(userId).toResponse().speciesIds)

        verify(veterinarians).findDetailsByUserId(userId)
        verify(permissions).findAllByVeterinarianId(id)
        verifyNoMoreInteractions(veterinarians, permissions)
    }

    @Test
    fun `missing profile does not load permissions`() {
        val id = UUID.randomUUID()
        `when`(veterinarians.findDetailsById(id)).thenReturn(null)

        assertFailsWith<VeterinarianNotFoundException> { useCase.findById(id) }

        verify(veterinarians).findDetailsById(id)
        verifyNoMoreInteractions(veterinarians)
        verifyNoInteractions(permissions)
    }

    private fun profile() = VeterinarianDetailsDto(
        veterinarian = Veterinarian(
            id = UUID.randomUUID(),
            userId = UUID.randomUUID(),
            specializationId = UUID.randomUUID(),
            experienceYears = 5,
            createdAt = Instant.parse("2026-11-01T10:00:00Z"),
            updatedAt = Instant.parse("2026-11-01T10:00:00Z"),
        ),
        firstName = "Alexey",
        middleName = null,
        lastName = "Petrov",
        fullName = "A. Petrov",
    )
}
