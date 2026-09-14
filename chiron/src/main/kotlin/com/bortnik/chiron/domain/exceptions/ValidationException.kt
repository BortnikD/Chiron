package com.bortnik.chiron.domain.exceptions

class ValidationException(
    val errors: Map<String, String>,
) : DomainException("Validation failed: ${errors.entries.joinToString("; ") { (field, error) -> "$field - $error" }}") {

    constructor(field: String, error: String) : this(mapOf(field to error))
}
