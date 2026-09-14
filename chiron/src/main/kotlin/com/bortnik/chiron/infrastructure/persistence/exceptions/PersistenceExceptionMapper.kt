package com.bortnik.chiron.infrastructure.persistence.exceptions

import org.postgresql.util.PSQLException
import org.postgresql.util.ServerErrorMessage
import java.sql.SQLException

fun SQLException.toPersistenceException(): PersistenceException {
    val root = rootSqlException()
    val sqlState = root.sqlState ?: this.sqlState
    val sqlError = SqlError.fromSqlState(sqlState)
    val server: ServerErrorMessage? = (root as? PSQLException)?.serverErrorMessage
    val constraint: String? = server?.constraint
    val table: String? = server?.table
    val column: String? = server?.column
    val detail: String? = server?.detail
    val message = buildMessage(sqlError, sqlState, constraint, table, column, detail ?: root.message)

    return when (sqlError) {
        SqlError.UNIQUE_VIOLATION ->
            UniqueViolationException(sqlError, sqlState, constraint, table, column, detail, message, this)

        SqlError.FOREIGN_KEY_VIOLATION ->
            ForeignKeyViolationException(sqlError, sqlState, constraint, table, column, detail, message, this)

        SqlError.NOT_NULL_VIOLATION ->
            NotNullViolationException(sqlError, sqlState, constraint, table, column, detail, message, this)

        SqlError.CHECK_VIOLATION ->
            CheckViolationException(sqlError, sqlState, constraint, table, column, detail, message, this)

        SqlError.INVALID_TEXT_REPRESENTATION,
        SqlError.NUMERIC_VALUE_OUT_OF_RANGE,
        SqlError.STRING_DATA_RIGHT_TRUNCATION,
            -> InvalidDataException(sqlError, sqlState, message, this)

        SqlError.SERIALIZATION_FAILURE,
        SqlError.DEADLOCK_DETECTED,
        SqlError.LOCK_NOT_AVAILABLE,
            -> ConcurrencyException(sqlError, sqlState, message, this)

        SqlError.QUERY_CANCELED -> QueryTimeoutException(sqlError, sqlState, message, this)
        SqlError.CONNECTION_FAILURE -> ConnectionException(sqlError, sqlState, message, this)
        SqlError.UNKNOWN -> UnknownPersistenceException(sqlError, sqlState, message, this)
    }
}

// Exposed wraps the driver exception; SQLSTATE and server details live in the deepest SQLException.
private fun SQLException.rootSqlException(): SQLException =
    generateSequence<Throwable>(this) { it.cause }
        .filterIsInstance<SQLException>()
        .lastOrNull { !it.sqlState.isNullOrBlank() }
        ?: this

private fun buildMessage(
    sqlError: SqlError,
    sqlState: String?,
    constraint: String?,
    table: String?,
    column: String?,
    details: String?,
): String = buildString {
    append(sqlError.description)
    append(" [").append(sqlError.name).append(", SQLSTATE=").append(sqlState ?: "?").append("]")
    constraint?.let { append(", constraint=").append(it) }
    table?.let { append(", table=").append(it) }
    column?.let { append(", column=").append(it) }
    details?.let { append(": ").append(it) }
}
