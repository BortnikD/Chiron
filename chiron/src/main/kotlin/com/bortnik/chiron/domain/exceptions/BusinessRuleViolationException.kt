package com.bortnik.chiron.domain.exceptions

open class BusinessRuleViolationException(
    message: String,
    cause: Throwable? = null,
) : DomainException(message, cause)
