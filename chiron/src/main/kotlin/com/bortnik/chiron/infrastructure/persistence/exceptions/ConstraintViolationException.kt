package com.bortnik.chiron.infrastructure.persistence.exceptions

open class ConstraintViolationException(
    sqlError: SqlError,
    sqlState: String?,
    val constraintName: String?,
    val tableName: String?,
    val columnName: String?,
    val detail: String?,
    message: String,
    cause: Throwable? = null,
) : PersistenceException(sqlError, sqlState, message, cause)
