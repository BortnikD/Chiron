package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.pet.ClientCreatePetUseCase
import com.bortnik.chiron.application.usecase.common.pet.CreatePetUseCase
import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import com.bortnik.chiron.infrastructure.persistence.mappers.toPet
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpeciesTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import com.bortnik.chiron.presentation.api.http.dto.request.pet.ClientCreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.CreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.support.TestEntities.pet
import jakarta.validation.Validation
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.openapitools.jackson.nullable.JsonNullableJackson3Module
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class PetBreedTest {
    private val json = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(JsonNullableJackson3Module())
        .build()
    private val today = LocalDate.of(2026, 11, 14)

    @Test
    fun `creation accepts an omitted null or text breed for both roles`() {
        for ((field, breed) in listOf(
            "" to null,
            """, "breed":null""" to null,
            """, "breed":"Labrador"""" to "Labrador",
        )) {
            val body = """{"name":"Pet","speciesId":"${pet.speciesId}","gender":"MALE"$field}"""
            val client = json.readValue(body, ClientCreatePetRequest::class.java).toDto()
            val adminBody = body.dropLast(1) + """, "ownerId":"${pet.ownerId}"}"""
            val admin = json.readValue(adminBody, CreatePetRequest::class.java).toDto()
            assertEquals(breed, client.breed)
            assertEquals(breed, admin.breed)

            val pets = mock(PetRepository::class.java)
            val expected = pet.copy(breed = breed)
            `when`(pets.create(admin)).thenReturn(expected)
            val clock = Clock.fixed(pet.createdAt, ZoneOffset.UTC)
            val useCase = ClientCreatePetUseCase(CreatePetUseCase(pets, clock))
            assertEquals(expected, useCase.create(Actor(pet.ownerId, UserRole.CLIENT, "Owner"), client))
            verify(pets).create(admin)
        }
    }

    @Test
    fun `patch preserves replaces and clears breed`() {
        val omitted = json.readValue("""{"name":"New name"}""", UpdatePetRequest::class.java).toDto()
        val replaced = json.readValue("""{"breed":"Metis"}""", UpdatePetRequest::class.java).toDto()
        val cleared = json.readValue("""{"breed":null}""", UpdatePetRequest::class.java).toDto()
        assertEquals(Patch.Unchanged, omitted.breed)
        assertEquals(Patch.Value("Metis"), replaced.breed)
        assertEquals(Patch.Value(null), cleared.breed)
    }

    @Test
    fun `breed length is checked in create and patch requests and domain DTOs`() {
        Validation.buildDefaultValidatorFactory().use { factory ->
            for (breed in listOf(null, "Labrador", "x".repeat(100), "x".repeat(101))) {
                val client = ClientCreatePetRequest("Pet", pet.speciesId, gender = Gender.MALE, breed = breed)
                val admin = CreatePetRequest("Pet", pet.ownerId, pet.speciesId, gender = Gender.MALE, breed = breed)
                val patchBody = json.writeValueAsString(mapOf("breed" to breed))
                val patch = json.readValue(patchBody, UpdatePetRequest::class.java)
                val invalid = breed != null && breed.length > 100
                for (request in listOf(client, admin, patch)) {
                    assertEquals(
                        if (invalid) listOf("breed") else emptyList(),
                        factory.validator.validate(request).map { it.propertyPath.toString() },
                    )
                }
                val validate = listOf(
                    { PetValidator.validate(admin.toDto(), today) },
                    { PetValidator.validate(patch.toDto(), today) },
                )
                for (check in validate) {
                    if (invalid) {
                        assertEquals(
                            listOf("breed"),
                            assertFailsWith<ValidationException> { check() }.errors.map { it.field },
                        )
                    } else {
                        check()
                    }
                }
            }
        }
    }

    @Test
    fun `stored breed reaches pet JSON responses including null`() {
        for (breed in listOf(null, "Labrador")) {
            val response = ResultRow.createAndFillValues(
                mapOf(
                    ExposedPetTable.id to EntityID(pet.id, ExposedPetTable),
                    ExposedPetTable.name to pet.name,
                    ExposedPetTable.ownerId to EntityID(pet.ownerId, ExposedUserTable),
                    ExposedPetTable.speciesId to EntityID(pet.speciesId, ExposedSpeciesTable),
                    ExposedPetTable.birthDate to null,
                    ExposedPetTable.weightKg to null,
                    ExposedPetTable.gender to pet.gender,
                    ExposedPetTable.notes to null,
                    ExposedPetTable.breed to breed,
                    ExposedPetTable.photoKey to null,
                    ExposedPetTable.isArchived to false,
                    ExposedPetTable.createdAt to pet.createdAt.atOffset(ZoneOffset.UTC),
                    ExposedPetTable.updatedAt to pet.updatedAt.atOffset(ZoneOffset.UTC),
                ),
            ).toPet().toResponse()
            val result = json.readTree(json.writeValueAsString(response))
            if (breed == null) assertTrue(result["breed"].isNull)
            else assertEquals(breed, result["breed"].asString())
        }
    }
}
