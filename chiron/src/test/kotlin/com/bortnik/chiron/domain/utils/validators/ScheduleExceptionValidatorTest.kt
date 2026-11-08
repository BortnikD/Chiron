package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.domain.exceptions.ValidationException
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ScheduleExceptionValidatorTest {
    private val date = LocalDate.parse("2026-11-08")
    private val existing = ScheduleException(
        UUID.randomUUID(), UUID.randomUUID(), ScheduleExceptionType.CUSTOM_HOURS,
        date, date.plusDays(2), LocalTime.of(9, 0), LocalTime.of(12, 0),
    )

    @Test
    fun `custom hours cannot share even one date with another custom hours range`() {
        for (start in listOf(date.minusDays(1), date, date.plusDays(2))) {
            val ex = assertFailsWith<ValidationException> {
                ScheduleExceptionValidator.validate(create(start), listOf(existing))
            }
            assertEquals(listOf("startDate"), ex.errors.map { it.field })
        }
    }

    @Test
    fun `adjacent date ranges and absences remain allowed`() {
        ScheduleExceptionValidator.validate(create(date.plusDays(3)), listOf(existing))
        ScheduleExceptionValidator.validate(
            create(date), listOf(
                existing.copy(
                    type = ScheduleExceptionType.ABSENCE,
                    startTime = null, endTime = null,
                ),
            ),
        )
        ScheduleExceptionValidator.validate(
            create(date).copy(
                type = ScheduleExceptionType.ABSENCE,
                startTime = null, endTime = null,
            ), listOf(existing),
        )
    }

    @Test
    fun `editing custom hours ignores the same record`() {
        ScheduleExceptionValidator.validate(
            existing, UpdateScheduleExceptionDto(startDate = date.plusDays(1)),
            listOf(existing),
        )
    }

    @Test
    fun `editing dates or converting absence to custom hours checks other records`() {
        val other = existing.copy(id = UUID.randomUUID(), startDate = date.plusDays(3), endDate = date.plusDays(4))
        assertFailsWith<ValidationException> {
            ScheduleExceptionValidator.validate(
                other, UpdateScheduleExceptionDto(startDate = date.plusDays(2)),
                listOf(existing, other),
            )
        }
        assertFailsWith<ValidationException> {
            ScheduleExceptionValidator.validate(
                other.copy(type = ScheduleExceptionType.ABSENCE),
                UpdateScheduleExceptionDto(type = ScheduleExceptionType.CUSTOM_HOURS, startDate = date),
                listOf(existing, other),
            )
        }
    }

    private fun create(start: LocalDate) = CreateScheduleExceptionDto(
        existing.veterinarianId,
        ScheduleExceptionType.CUSTOM_HOURS, start, start.plusDays(1), LocalTime.of(14, 0), LocalTime.of(18, 0),
    )
}
