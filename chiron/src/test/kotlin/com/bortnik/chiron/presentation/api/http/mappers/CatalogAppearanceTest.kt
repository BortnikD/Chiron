package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.utils.validators.SpeciesValidator
import com.bortnik.chiron.domain.utils.validators.SpecializationValidator
import com.bortnik.chiron.infrastructure.persistence.mappers.toSpecies
import com.bortnik.chiron.infrastructure.persistence.mappers.toSpecialization
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpeciesTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpecializationTable
import com.bortnik.chiron.presentation.api.http.dto.request.species.CreateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.species.UpdateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.CreateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.UpdateSpecializationRequest
import jakarta.validation.Validation
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.junit.jupiter.api.Test
import org.openapitools.jackson.nullable.JsonNullable
import org.openapitools.jackson.nullable.JsonNullableJackson3Module
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class CatalogAppearanceTest {

    private val json = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(JsonNullableJackson3Module())
        .build()

    @Test
    fun `creation accepts optional appearance fields and arbitrary icon keys`() {
        val species = json.readValue(
            """{"name":"Cat","color":"#12aBcF","iconKey":"custom:cat"}""",
            CreateSpeciesRequest::class.java,
        ).toDto()
        val specialization = json.readValue(
            """{"name":"Surgery","description":"","color":"#ABCDEF"}""",
            CreateSpecializationRequest::class.java,
        ).toDto()

        assertEquals("#12aBcF", species.color)
        assertEquals("custom:cat", species.iconKey)
        assertEquals("#ABCDEF", specialization.color)
        SpeciesValidator.validate(species)
        SpecializationValidator.validate(specialization)
        assertEquals(null, CreateSpeciesRequest("Cat").toDto().color)
        assertEquals(null, CreateSpeciesRequest("Cat").toDto().iconKey)
        assertEquals(null, CreateSpecializationRequest("Surgery", "").toDto().color)
    }

    @Test
    fun `omitted patch fields retain stored appearance`() {
        assertEquals(UpdateSpeciesDto(), json.readValue("{}", UpdateSpeciesRequest::class.java).toDto())
        assertEquals(
            UpdateSpecializationDto(),
            json.readValue("{}", UpdateSpecializationRequest::class.java).toDto(),
        )
        val species = json.readValue("""{"name":"Dog"}""", UpdateSpeciesRequest::class.java).toDto()
        assertEquals(Patch.Unchanged, species.color)
        assertEquals(Patch.Unchanged, species.iconKey)
    }

    @Test
    fun `explicit null clears appearance and values replace it independently`() {
        val clearedSpecies = json.readValue(
            """{"color":null,"iconKey":null}""", UpdateSpeciesRequest::class.java,
        ).toDto()
        val clearedSpecialization = json.readValue(
            """{"color":null}""", UpdateSpecializationRequest::class.java,
        ).toDto()
        assertEquals(Patch.Value(null), clearedSpecies.color)
        assertEquals(Patch.Value(null), clearedSpecies.iconKey)
        assertEquals(Patch.Value(null), clearedSpecialization.color)
        SpeciesValidator.validate(clearedSpecies)
        SpecializationValidator.validate(clearedSpecialization)

        val colorOnly = json.readValue("""{"color":"#123abc"}""", UpdateSpeciesRequest::class.java).toDto()
        val iconOnly = json.readValue("""{"iconKey":"dog"}""", UpdateSpeciesRequest::class.java).toDto()
        assertEquals(Patch.Value("#123abc"), colorOnly.color)
        assertEquals(Patch.Unchanged, colorOnly.iconKey)
        assertEquals(Patch.Unchanged, iconOnly.color)
        assertEquals(Patch.Value("dog"), iconOnly.iconKey)
        assertEquals(
            Patch.Value("#123abc"),
            json.readValue("""{"color":"#123abc"}""", UpdateSpecializationRequest::class.java).toDto().color,
        )
    }

    @Test
    fun `valid colors and null pass request and domain validation`() {
        Validation.buildDefaultValidatorFactory().use { factory ->
            for (color in listOf(null, "#000000", "#ffffff", "#12AbCd")) {
                val species = CreateSpeciesRequest("Cat", color)
                val specialization = CreateSpecializationRequest("Surgery", "", color)
                val speciesPatch = UpdateSpeciesRequest(color = JsonNullable.of(color))
                val specializationPatch = UpdateSpecializationRequest(color = JsonNullable.of(color))
                for (request in listOf(species, specialization, speciesPatch, specializationPatch)) {
                    assertTrue(factory.validator.validate(request).isEmpty(), "Color: $color")
                }
                SpeciesValidator.validate(species.toDto())
                SpeciesValidator.validate(speciesPatch.toDto())
                SpecializationValidator.validate(specialization.toDto())
                SpecializationValidator.validate(specializationPatch.toDto())
            }
        }
    }

    @Test
    fun `invalid colors fail request and domain validation for create and update`() {
        Validation.buildDefaultValidatorFactory().use { factory ->
            for (color in listOf("", "red", "123456", "#123", "#12345678", "#12GG56", " #123456", "#123456\n")) {
                val species = CreateSpeciesRequest("Cat", color)
                val specialization = CreateSpecializationRequest("Surgery", "", color)
                val speciesPatch = UpdateSpeciesRequest(color = JsonNullable.of(color))
                val specializationPatch = UpdateSpecializationRequest(color = JsonNullable.of(color))
                for (request in listOf(species, specialization, speciesPatch, specializationPatch)) {
                    assertEquals(
                        listOf("color"),
                        factory.validator.validate(request).map { it.propertyPath.toString() })
                }
                val validations = listOf<() -> Unit>(
                    { SpeciesValidator.validate(species.toDto()) },
                    { SpeciesValidator.validate(speciesPatch.toDto()) },
                    { SpecializationValidator.validate(specialization.toDto()) },
                    { SpecializationValidator.validate(specializationPatch.toDto()) },
                )
                for (validate in validations) {
                    assertEquals(
                        listOf("color"),
                        assertFailsWith<ValidationException> { validate() }.errors.map { it.field })
                }
            }
        }
    }

    @Test
    fun `stored appearance reaches JSON responses including explicit nulls`() {
        for (color in listOf(null, "#aBc123")) {
            val species = ResultRow.createAndFillValues(
                mapOf(
                    ExposedSpeciesTable.id to EntityID(UUID.randomUUID(), ExposedSpeciesTable),
                    ExposedSpeciesTable.name to "Cat",
                    ExposedSpeciesTable.color to color,
                    ExposedSpeciesTable.iconKey to color?.let { "cat" },
                ),
            ).toSpecies().toResponse()
            val specialization = ResultRow.createAndFillValues(
                mapOf(
                    ExposedSpecializationTable.id to EntityID(UUID.randomUUID(), ExposedSpecializationTable),
                    ExposedSpecializationTable.name to "Surgery",
                    ExposedSpecializationTable.description to "",
                    ExposedSpecializationTable.color to color,
                ),
            ).toSpecialization().toResponse()
            val speciesJson = json.readTree(json.writeValueAsString(species))
            val specializationJson = json.readTree(json.writeValueAsString(specialization))

            if (color == null) {
                assertTrue(speciesJson["color"].isNull)
                assertTrue(speciesJson["iconKey"].isNull)
                assertTrue(specializationJson["color"].isNull)
            } else {
                assertEquals(color, speciesJson["color"].asString())
                assertEquals("cat", speciesJson["iconKey"].asString())
                assertEquals(color, specializationJson["color"].asString())
            }
        }
    }
}
