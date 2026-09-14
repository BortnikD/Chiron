package com.bortnik.chiron.infrastructure.persistence.exceptions

open class PersistenceException(
    val sqlError: SqlError,
    val sqlState: String?,
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
