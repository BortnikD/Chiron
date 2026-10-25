package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.statistics.StatisticsPeriod
import com.bortnik.chiron.domain.exceptions.ValidationException
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.ZoneId
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class StatisticsValidatorTest {

    @Test
    fun `single-day period is accepted`() {
        StatisticsValidator.validate(period(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 1)))
    }

    @Test
    fun `period ending before it starts is rejected`() {
        val ex = assertFailsWith<ValidationException> {
            StatisticsValidator.validate(period(LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 1)))
        }

        assertEquals(listOf("to"), ex.errors.map { it.field })
    }

    private fun period(from: LocalDate, to: LocalDate) = StatisticsPeriod(from, to, ZoneId.of("Europe/Moscow"))
}
