package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.exceptions.ValidationError
import com.bortnik.chiron.domain.exceptions.ValidationException

class ValidationErrorCollector {
    private val errors = mutableListOf<ValidationError>()

    fun error(field: String, message: String) {
        errors += ValidationError(field, message)
    }

    fun ensure(condition: Boolean, field: String, message: String) {
        if (!condition) error(field, message)
    }

    fun ensureNotBlank(field: String, value: String?) =
        ensure(value == null || value.isNotBlank(), field, "must not be blank")

    fun ensureMaxLength(field: String, value: String?, max: Int) =
        ensure(value == null || value.length <= max, field, "must be at most $max characters")

    fun ensureMatches(field: String, value: String?, regex: Regex, message: String) =
        ensure(value == null || regex.matches(value), field, message)

    fun ensureInRange(field: String, value: Int?, min: Int, max: Int) =
        ensure(value == null || value in min..max, field, "must be between $min and $max")

    fun ensureInRange(field: String, value: Double?, min: Double, max: Double) =
        ensure(value == null || (value in min..max), field, "must be between $min and $max")

    // Half-open range [from, to): an empty range is rejected.
    fun <T : Comparable<T>> ensureAfter(field: String, value: T?, lowerField: String, lower: T?) =
        ensure(value == null || lower == null || value > lower, field, "must be after $lowerField")

    // Inclusive range [from, to]: a single-point range is allowed.
    fun <T : Comparable<T>> ensureNotBefore(field: String, value: T?, lowerField: String, lower: T?) =
        ensure(value == null || lower == null || value >= lower, field, "must not be before $lowerField")

    fun throwIfAny() {
        if (errors.isNotEmpty()) throw ValidationException(errors.toList())
    }
}

inline fun validateAll(block: ValidationErrorCollector.() -> Unit) =
    ValidationErrorCollector().apply(block).throwIfAny()
