package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedVeterinarianTable : UUIDTable("veterinarian") {
    val userId = reference("user_id", ExposedUserTable)
    val specializationId = reference("specialization_id", ExposedSpecializationTable)
    val bio = text("bio").nullable()
    val photoUrl = text("photo_url").nullable()
    val experienceYears = integer("experience_years")
    val isActive = bool("is_active")
    val createdAt = timestampWithTimeZone("created_at")
    val updatedAt = timestampWithTimeZone("updated_at")
}
