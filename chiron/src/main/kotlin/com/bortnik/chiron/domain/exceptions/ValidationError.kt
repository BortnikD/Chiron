package com.bortnik.chiron.domain.exceptions

data class ValidationError(
    val field: String,
    val message: String,
)
