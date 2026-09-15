package com.bortnik.chiron.presentation.api.http.dto.request.auth

data class LoginRequest(
    val email: String,
    val password: String,
)
