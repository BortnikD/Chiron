package com.bortnik.chiron.infrastructure.persistence.exceptions

import org.junit.jupiter.api.Test
import org.postgresql.util.PSQLException
import org.postgresql.util.ServerErrorMessage
import java.sql.SQLException
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertSame

class PersistenceExceptionMapperTest {

    @Test
    fun `fromSqlState resolves known code and falls back to UNKNOWN`() {
        assertSame(SqlError.UNIQUE_VIOLATION, SqlError.fromSqlState("23505"))
        assertSame(SqlError.DEADLOCK_DETECTED, SqlError.fromSqlState("40P01"))
        assertSame(SqlError.UNKNOWN, SqlError.fromSqlState("42P01"))
        assertSame(SqlError.UNKNOWN, SqlError.fromSqlState(null))
        assertSame(SqlError.UNKNOWN, SqlError.fromSqlState(""))
    }

    @Test
    fun `unique violation is mapped with constraint details from nested driver exception`() {
        val driverError = pgError(
            sqlState = "23505",
            message = "duplicate key value violates unique constraint users_phone_key",
            constraint = "users_phone_key",
            table = "users",
            detail = "Key (phone)=(+79990000000) already exists.",
        )
        val wrapped = SQLException("wrapper", driverError)

        val result = wrapped.toPersistenceException()

        assertIs<UniqueViolationException>(result)
        assertSame(SqlError.UNIQUE_VIOLATION, result.sqlError)
        assertEquals("23505", result.sqlState)
        assertEquals("users_phone_key", result.constraintName)
        assertEquals("users", result.tableName)
        assertEquals("Key (phone)=(+79990000000) already exists.", result.detail)
        assertSame(wrapped, result.cause)
    }

    @Test
    fun `foreign key and not null violations are mapped to their own types`() {
        assertIs<ForeignKeyViolationException>(
            pgError("23503", "insert violates foreign key", constraint = "pet_owner_id_fkey").toPersistenceException(),
        )
        val notNull = pgError("23502", "null value in column", table = "pet", column = "name").toPersistenceException()
        assertIs<NotNullViolationException>(notNull)
        assertEquals("name", notNull.columnName)
    }

    @Test
    fun `other codes are mapped by category`() {
        assertIs<CheckViolationException>(pgError("23514", "check").toPersistenceException())
        assertIs<InvalidDataException>(pgError("22P02", "invalid input syntax for type uuid").toPersistenceException())
        assertIs<ConcurrencyException>(pgError("40P01", "deadlock detected").toPersistenceException())
        assertIs<QueryTimeoutException>(pgError("57014", "canceling statement").toPersistenceException())
        assertIs<ConnectionException>(pgError("08006", "connection failure").toPersistenceException())
        assertIs<UnknownPersistenceException>(pgError("42P01", "relation does not exist").toPersistenceException())
        assertIs<UnknownPersistenceException>(SQLException("no state").toPersistenceException())
    }

    // Builds a PSQLException from PostgreSQL protocol fields: field code + value, NUL-separated.
    private fun pgError(
        sqlState: String,
        message: String,
        constraint: String? = null,
        table: String? = null,
        column: String? = null,
        detail: String? = null,
    ): PSQLException {
        val nul = Char(0)
        val fields = buildString {
            append("SERROR").append(nul)
            append("C").append(sqlState).append(nul)
            append("M").append(message).append(nul)
            constraint?.let { append("n").append(it).append(nul) }
            table?.let { append("t").append(it).append(nul) }
            column?.let { append("c").append(it).append(nul) }
            detail?.let { append("D").append(it).append(nul) }
        }
        return PSQLException(ServerErrorMessage(fields))
    }
}
