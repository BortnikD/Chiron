package com.bortnik.chiron.infrastructure.persistence.exceptions

class QueryTimeoutException(
    sqlError: SqlError,
    sqlState: String?,
    message: String,
    cause: Throwable? = null,
) : PersistenceException(sqlError, sqlState, message, cause)
