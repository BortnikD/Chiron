package com.bortnik.chiron.presentation.api.http

import org.springframework.http.HttpStatus

data class ApiError(
    val name: String,
    val message: String,
    val status: HttpStatus,
    val path: String,
    val violations: List<ApiViolation>? = null,
)
