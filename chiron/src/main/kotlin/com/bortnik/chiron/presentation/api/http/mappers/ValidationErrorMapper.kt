package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.exceptions.ValidationError
import com.bortnik.chiron.presentation.api.http.ApiViolation

fun ValidationError.toApiViolation(): ApiViolation = ApiViolation(
    field = field,
    message = message,
)
