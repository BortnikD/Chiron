package com.bortnik.chiron.infrastructure.persistence.exceptions

class CheckViolationException(
    sqlError: SqlError,
    sqlState: String?,
    constraintName: String?,
    tableName: String?,
    columnName: String?,
    detail: String?,
    message: String,
    cause: Throwable? = null,
) : ConstraintViolationException(sqlError, sqlState, constraintName, tableName, columnName, detail, message, cause)
