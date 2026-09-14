package com.bortnik.chiron.domain.exceptions

abstract class DomainException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
