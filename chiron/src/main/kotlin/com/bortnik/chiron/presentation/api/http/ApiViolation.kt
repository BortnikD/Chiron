package com.bortnik.chiron.presentation.api.http

data class ApiViolation(
    val field: String,
    val message: String,
)
