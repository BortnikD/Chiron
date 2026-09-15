package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.presentation.api.http.dto.response.UserResponse

fun User.toResponse(): UserResponse = UserResponse(
    id = id,
    email = email,
    firstName = firstName,
    middleName = middleName,
    lastName = lastName,
    fullName = fullName,
    phone = phone,
    role = role,
    createdAt = createdAt,
    updatedAt = updatedAt,
)
