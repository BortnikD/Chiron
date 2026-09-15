package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.presentation.api.http.dto.request.auth.RegisterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.user.CreateUserRequest
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

fun RegisterRequest.toDto(): RegisterUserDto = RegisterUserDto(
    email = email,
    password = password,
    firstName = firstName,
    middleName = middleName,
    lastName = lastName,
    phone = phone,
    role = UserRole.CLIENT,
)

fun CreateUserRequest.toDto(): RegisterUserDto = RegisterUserDto(
    email = email,
    password = password,
    firstName = firstName,
    middleName = middleName,
    lastName = lastName,
    phone = phone,
    role = role,
)
