package com.bortnik.chiron.presentation.api.http.dto.request.auth

data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val middleName: String? = null,
    val lastName: String,
    val phone: String,
)
