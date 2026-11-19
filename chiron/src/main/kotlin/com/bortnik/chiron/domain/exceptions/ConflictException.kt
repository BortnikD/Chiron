package com.bortnik.chiron.domain.exceptions

open class ConflictException(
    message: String,
    cause: Throwable? = null,
    val errors: List<ValidationError> = emptyList(),
) : DomainException(message, cause)
