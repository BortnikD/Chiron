package com.bortnik.chiron.presentation.api.http.dto.response

data class AuthResponse(
    val accessToken: String,
    val user: UserResponse,
)
