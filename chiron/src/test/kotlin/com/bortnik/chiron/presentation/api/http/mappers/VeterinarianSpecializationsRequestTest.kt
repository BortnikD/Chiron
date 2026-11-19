package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.utils.validators.VeterinarianValidator
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.CreateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.UpdateVeterinarianRequest
import org.junit.jupiter.api.Test
import org.openapitools.jackson.nullable.JsonNullableJackson3Module
import tools.jackson.databind.exc.InvalidNullException
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class VeterinarianSpecializationsRequestTest {
    private val json = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(JsonNullableJackson3Module())
        .build()
    private val primary = UUID(0, 1)
    private val secondary = UUID(0, 2)

    @Test
    fun `legacy and new create requests preserve their specialization selection`() {
        val prefix = """{"userId":"${UUID(0, 3)}","experienceYears":5,"""
        val legacy = json.readValue(
            prefix + """"specializationId":"$primary"}""", CreateVeterinarianRequest::class.java,
        ).toDto()
        val multiple = json.readValue(
            prefix + """"specializationIds":["$primary","$secondary"]}""", CreateVeterinarianRequest::class.java,
        ).toDto()

        VeterinarianValidator.validate(legacy)
        VeterinarianValidator.validate(multiple)
        assertEquals(primary, legacy.specializationId)
        assertEquals(listOf(primary), legacy.specializationIds)
        assertNull(multiple.specializationId)
        assertEquals(listOf(primary, secondary), multiple.specializationIds)
    }

    @Test
    fun `patch distinguishes omitted lists and rejects invalid selections`() {
        val omitted =
            json.readValue("""{"specializationId":"$primary"}""", UpdateVeterinarianRequest::class.java).toDto()
        assertNull(omitted.specializationIds)
        assertEquals(primary, omitted.specializationId)
        VeterinarianValidator.validate(omitted)

        for (ids in listOf(emptyList(), listOf(primary, primary), listOf(secondary))) {
            assertFailsWith<ValidationException> {
                VeterinarianValidator.validate(UpdateVeterinarianRequest(primary, specializationIds = ids).toDto())
            }
        }

        assertFailsWith<InvalidNullException> {
            json.readValue(
                """{"specializationIds":["$primary",null]}""", UpdateVeterinarianRequest::class.java,
            )
        }
    }
}
