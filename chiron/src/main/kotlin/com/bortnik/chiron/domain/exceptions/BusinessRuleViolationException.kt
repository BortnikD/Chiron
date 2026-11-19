package com.bortnik.chiron.domain.exceptions

open class BusinessRuleViolationException(
    message: String,
    cause: Throwable? = null,
    val errors: List<ValidationError> = emptyList(),
) : DomainException(message, cause) {
    constructor(errors: List<ValidationError>) : this(
        errors.joinToString("; ") { "${it.field} ${it.message}" },
        errors = errors,
    )
}
