package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.application.usecase.common.notification.CreateNotificationUseCase
import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.pet
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class UpdatePetUseCaseTest {
    private val pets = mock(PetRepository::class.java)
    private val notifications = mock(CreateNotificationUseCase::class.java)
    private val species = mock(SpeciesRepository::class.java)
    private val useCase = UpdatePetUseCase(pets, Clock.fixed(now, ZoneOffset.UTC), notifications, species)
    private val administratorId = UUID.randomUUID()
    private val fallback =
        CreateNotificationDto(pet.ownerId, type = NotificationType.PET_UPDATED, title = "Title", body = "Body")

    @Test
    fun `administrator changes to pet data notify owner without reloading pet context`() {
        val date = LocalDate.of(2020, 1, 1)
        val dog = Species(UUID(1, 1), "Dog")
        `when`(species.findById(dog.id)).thenReturn(dog)
        val cases = listOf(
            UpdatePetDto(name = "New name") to pet.copy(name = "New name"),
            UpdatePetDto(speciesId = UUID(1, 1)) to pet.copy(speciesId = UUID(1, 1)),
            UpdatePetDto(gender = Gender.FEMALE) to pet.copy(gender = Gender.FEMALE),
            UpdatePetDto(weightKg = Patch.Value(5.0)) to pet.copy(weightKg = 5.0),
            UpdatePetDto(birthDate = Patch.Value(date)) to pet.copy(birthDate = date),
            UpdatePetDto(notes = Patch.Value("Private medical notes")) to pet.copy(notes = "Private medical notes"),
            UpdatePetDto(breed = Patch.Value("Breed")) to pet.copy(breed = "Breed"),
        )
        for ((dto, updated) in cases) {
            `when`(pets.update(pet.id, dto)).thenReturn(updated)
            assertEquals(updated, useCase.update(pet, dto, administratorId))
            verify(pets).update(pet.id, dto)
        }
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(notifications, times(cases.size)).create(captor.capture() ?: fallback)
        assertTrue(captor.allValues.all { it.type == NotificationType.PET_UPDATED && it.recipientId == pet.ownerId })
        assertTrue(captor.allValues.all { it.actorId == administratorId && it.petId == pet.id })
        assertFalse(captor.allValues.any { it.body.contains("Private medical notes") })
        verifyNoMoreInteractions(pets)
    }

    @Test
    fun `unknown species is rejected before writing the pet`() {
        assertFailsWith<SpeciesNotFoundException> {
            useCase.update(pet, UpdatePetDto(speciesId = UUID(1, 1)), administratorId)
        }
        verifyNoInteractions(pets, notifications)
    }

    @Test
    fun `archive and restoration notify owner even when owner made the change`() {
        val archived = pet.copy(isArchived = true)
        val archive = UpdatePetDto(isArchived = true)
        val restore = UpdatePetDto(isArchived = false)
        `when`(pets.update(pet.id, archive)).thenReturn(archived)
        `when`(pets.update(pet.id, restore)).thenReturn(pet)
        useCase.update(pet, archive, pet.ownerId)
        useCase.update(archived, restore, pet.ownerId)
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(notifications, times(2)).create(captor.capture() ?: fallback)
        assertEquals(
            listOf(NotificationType.PET_ARCHIVED, NotificationType.PET_RESTORED),
            captor.allValues.map { it.type })
        assertTrue(captor.allValues.all { it.recipientId == pet.ownerId && it.actorId == pet.ownerId })
    }

    @Test
    fun `unchanged data timestamps and photos do not create notifications`() {
        for (updated in listOf(pet, pet.copy(updatedAt = now.plusSeconds(1)), pet.copy(photoKey = "photo"))) {
            `when`(pets.update(pet.id, UpdatePetDto())).thenReturn(updated)
            useCase.update(pet, UpdatePetDto(), administratorId)
        }
        verifyNoInteractions(notifications)
    }

    @Test
    fun `routine owner edits do not notify the owner`() {
        val dto = UpdatePetDto(name = "New name")
        `when`(pets.update(pet.id, dto)).thenReturn(pet.copy(name = "New name"))
        useCase.update(pet, dto, pet.ownerId)
        verifyNoInteractions(notifications)
    }
}
