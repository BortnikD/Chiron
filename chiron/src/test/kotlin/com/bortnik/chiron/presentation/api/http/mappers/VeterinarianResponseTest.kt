package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.infrastructure.persistence.mappers.toVeterinarianDetailsDto
import com.bortnik.chiron.infrastructure.persistence.models.ExposedSpecializationTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedVeterinarianTable
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class VeterinarianResponseTest {

    @Test
    fun `joined user names reach the public response with and without a middle name`() {
        val userId = UUID.randomUUID()
        val veterinarianId = UUID.randomUUID()
        val timestamp = OffsetDateTime.parse("2026-11-01T10:00:00Z")
        val mapper = JsonMapper.builder().build()

        for (middleName in listOf("Ivanovich", null)) {
            val fullName = if (middleName == null) "A. Petrov" else "A. I. Petrov"
            val row = ResultRow.createAndFillValues(
                mapOf(
                    ExposedVeterinarianTable.id to EntityID(veterinarianId, ExposedVeterinarianTable),
                    ExposedVeterinarianTable.userId to EntityID(userId, ExposedUserTable),
                    ExposedVeterinarianTable.specializationId to EntityID(
                        UUID.randomUUID(),
                        ExposedSpecializationTable,
                    ),
                    ExposedVeterinarianTable.bio to null,
                    ExposedVeterinarianTable.photoUrl to null,
                    ExposedVeterinarianTable.experienceYears to 5,
                    ExposedVeterinarianTable.isActive to true,
                    ExposedVeterinarianTable.createdAt to timestamp,
                    ExposedVeterinarianTable.updatedAt to timestamp,
                    ExposedUserTable.firstName to "Alexey",
                    ExposedUserTable.middleName to middleName,
                    ExposedUserTable.lastName to "Petrov",
                    ExposedUserTable.fullName to fullName,
                ),
            )

            val json = mapper.readTree(mapper.writeValueAsString(row.toVeterinarianDetailsDto().toResponse()))

            assertEquals(veterinarianId.toString(), json["id"].asString())
            assertEquals(userId.toString(), json["userId"].asString())
            assertEquals("Alexey", json["firstName"].asString())
            assertEquals("Petrov", json["lastName"].asString())
            assertEquals(fullName, json["fullName"].asString())
            if (middleName == null) {
                assertTrue(json["middleName"].isNull)
            } else {
                assertEquals(middleName, json["middleName"].asString())
            }
        }
    }
}
