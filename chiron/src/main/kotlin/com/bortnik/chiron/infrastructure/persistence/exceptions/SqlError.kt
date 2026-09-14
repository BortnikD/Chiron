package com.bortnik.chiron.infrastructure.persistence.exceptions

/**
 * PostgreSQL SQLSTATE codes the application reacts to. Anything else is [UNKNOWN]
 * and ends up as a generic server error.
 */
enum class SqlError(val sqlState: String, val description: String) {
    UNIQUE_VIOLATION("23505", "Unique constraint violated"),
    FOREIGN_KEY_VIOLATION("23503", "Foreign key constraint violated"),
    NOT_NULL_VIOLATION("23502", "Not-null constraint violated"),
    CHECK_VIOLATION("23514", "Check constraint violated"),
    INVALID_TEXT_REPRESENTATION("22P02", "Invalid text representation of a value"),
    NUMERIC_VALUE_OUT_OF_RANGE("22003", "Numeric value out of range"),
    STRING_DATA_RIGHT_TRUNCATION("22001", "String value too long for column"),
    SERIALIZATION_FAILURE("40001", "Transaction serialization failure"),
    DEADLOCK_DETECTED("40P01", "Deadlock detected"),
    LOCK_NOT_AVAILABLE("55P03", "Lock not available"),
    QUERY_CANCELED("57014", "Query canceled (timeout)"),
    CONNECTION_FAILURE("08006", "Database connection failure"),
    UNKNOWN("", "Unknown database error"),
    ;

    companion object {
        private val byState = entries.filter { it.sqlState.isNotEmpty() }.associateBy { it.sqlState }

        fun fromSqlState(sqlState: String?): SqlError = byState[sqlState] ?: UNKNOWN
    }
}
