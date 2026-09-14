package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.infrastructure.persistence.models.ExposedUserTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toUser(): User = User(
    id = this[ExposedUserTable.id].value,
    email = this[ExposedUserTable.email],
    passwordHash = this[ExposedUserTable.passwordHash],
    firstName = this[ExposedUserTable.firstName],
    middleName = this[ExposedUserTable.middleName],
    lastName = this[ExposedUserTable.lastName],
    fullName = this[ExposedUserTable.fullName],
    phone = this[ExposedUserTable.phone],
    role = this[ExposedUserTable.role],
    createdAt = this[ExposedUserTable.createdAt].toInstant(),
    updatedAt = this[ExposedUserTable.updatedAt].toInstant(),
)
