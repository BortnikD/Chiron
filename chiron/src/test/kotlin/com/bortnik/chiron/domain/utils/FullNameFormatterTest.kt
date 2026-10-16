package com.bortnik.chiron.domain.utils

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class FullNameFormatterTest {

    @Test
    fun `initials of first and middle names precede the last name`() {
        assertEquals("И. И. Петров", FullNameFormatter.format("Иван", "Иванович", "Петров"))
    }

    @Test
    fun `missing middle name is skipped`() {
        assertEquals("И. Петров", FullNameFormatter.format("Иван", null, "Петров"))
    }

    @Test
    fun `blank middle name is skipped`() {
        assertEquals("И. Петров", FullNameFormatter.format("Иван", "  ", "Петров"))
    }

    @Test
    fun `initials are upper-cased and surrounding spaces are trimmed`() {
        assertEquals("A. B. Smith", FullNameFormatter.format(" anna", "bella ", " Smith "))
    }
}
