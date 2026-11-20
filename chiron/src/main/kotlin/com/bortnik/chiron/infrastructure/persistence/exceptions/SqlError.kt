package com.bortnik.chiron.infrastructure.persistence.exceptions

/**
 * PostgreSQL SQLSTATE codes the application reacts to. Anything else is [UNKNOWN]
 * and ends up as a generic server error.
 */
enum class SqlError(val sqlState: String, val description: String) {
    UNIQUE_VIOLATION("23505", "Unique constraint violated"),
    EXCLUSION_VIOLATION("23P01", "Overlapping appointment intervals"),
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
    CONNECTION_UNABLE_TO_CONNECT("08001", "Unable to establish a database connection"),
    CONNECTION_DOES_NOT_EXIST("08003", "Database connection does not exist"),
    CONNECTION_FAILURE("08006", "Database connection failure"),
    ADMIN_SHUTDOWN("57P01", "Database was shut down by an administrator"),
    CRASH_SHUTDOWN("57P02", "Database shut down after a crash"),
    CANNOT_CONNECT_NOW("57P03", "Database cannot accept connections right now"),
    UNKNOWN("", "Unknown database error"),
    ;

    companion object {
        private val byState = entries.filter { it.sqlState.isNotEmpty() }.associateBy { it.sqlState }

        fun fromSqlState(sqlState: String?): SqlError = byState[sqlState] ?: UNKNOWN
    }
}
