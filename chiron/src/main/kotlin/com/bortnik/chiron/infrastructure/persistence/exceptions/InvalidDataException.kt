package com.bortnik.chiron.infrastructure.persistence.exceptions

class InvalidDataException(
    sqlError: SqlError,
    sqlState: String?,
    message: String,
    cause: Throwable? = null,
) : PersistenceException(sqlError, sqlState, message, cause)
