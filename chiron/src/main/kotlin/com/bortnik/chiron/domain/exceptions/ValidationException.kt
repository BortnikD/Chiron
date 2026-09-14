package com.bortnik.chiron.domain.exceptions

class ValidationException(
    val errors: List<ValidationError>,
) : DomainException("Validation failed: ${errors.joinToString("; ") { "${it.field} ${it.message}" }}")
