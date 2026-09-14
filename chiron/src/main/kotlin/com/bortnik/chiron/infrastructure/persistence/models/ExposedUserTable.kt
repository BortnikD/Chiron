package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.ENUM_LENGTH
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedUserTable : UUIDTable("users") {
    val email = text("email")
    val passwordHash = text("password_hash")
    val firstName = text("first_name")
    val middleName = text("middle_name").nullable()
    val lastName = text("last_name")
    val fullName = text("full_name")
    val phone = text("phone")
    val role = enumerationByName<UserRole>("role", ENUM_LENGTH)
    val createdAt = timestampWithTimeZone("created_at")
    val updatedAt = timestampWithTimeZone("updated_at")
}
