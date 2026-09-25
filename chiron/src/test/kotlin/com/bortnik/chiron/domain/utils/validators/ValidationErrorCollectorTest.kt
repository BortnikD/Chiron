package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.exceptions.ValidationException
import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ValidationErrorCollectorTest {

    @Test
    fun `half-open range rejects equal bounds`() {
        val ex = assertFailsWith<ValidationException> {
            validateAll { ensureAfter("to", DAY, "from", DAY) }
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    @Test
    fun `inclusive range accepts equal bounds and rejects reversed ones`() {
        validateAll { ensureNotBefore("to", DAY, "from", DAY) }

        val ex = assertFailsWith<ValidationException> {
            validateAll { ensureNotBefore("to", DAY.minusDays(1), "from", DAY) }
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    @Test
    fun `range with a missing bound is not checked`() {
        validateAll {
            ensureAfter("to", null, "from", DAY)
            ensureNotBefore("to", DAY, "from", null)
        }
    }

    private companion object {
        val DAY: LocalDate = LocalDate.parse("2026-09-25")
    }
}
