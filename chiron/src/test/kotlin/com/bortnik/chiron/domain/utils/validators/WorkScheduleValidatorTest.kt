package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.Test
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertFailsWith

class WorkScheduleValidatorTest {
    private val dto = CreateWorkScheduleDto(
        veterinarian.id,
        DayOfWeek.MONDAY,
        LocalTime.of(9, 0),
        LocalTime.of(18, 0),
        LocalTime.of(12, 0),
        LocalTime.of(13, 0),
    )
    private val existing = WorkSchedule(
        UUID.randomUUID(),
        dto.veterinarianId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
        dto.breakStart,
        dto.breakEnd
    )

    @Test
    fun `valid hours accept no break and a break touching working hour bounds`() {
        WorkScheduleValidator.validate(dto)
        WorkScheduleValidator.validate(dto.copy(breakStart = null, breakEnd = null))
        WorkScheduleValidator.validate(dto.copy(breakStart = dto.startTime, breakEnd = dto.endTime))
    }

    @Test
    fun `empty reversed or out of shift breaks and incomplete pairs are rejected`() {
        for (invalid in listOf(
            dto.copy(endTime = dto.startTime), dto.copy(startTime = dto.endTime, endTime = dto.startTime),
            dto.copy(breakStart = null), dto.copy(breakEnd = null),
            dto.copy(breakEnd = dto.breakStart), dto.copy(breakStart = dto.breakEnd, breakEnd = dto.breakStart),
            dto.copy(breakStart = dto.startTime.minusMinutes(1)), dto.copy(breakEnd = dto.endTime.plusMinutes(1)),
        )) {
            assertFailsWith<ValidationException> { WorkScheduleValidator.validate(invalid) }
        }
    }

    @Test
    fun `partial hour change is checked against the retained break`() {
        assertFailsWith<ValidationException> {
            WorkScheduleValidator.validate(
                existing,
                UpdateWorkScheduleDto(endTime = LocalTime.of(12, 30))
            )
        }
        assertFailsWith<ValidationException> {
            WorkScheduleValidator.validate(
                existing,
                UpdateWorkScheduleDto(startTime = LocalTime.of(12, 30))
            )
        }
        assertFailsWith<ValidationException> {
            WorkScheduleValidator.validate(
                existing,
                UpdateWorkScheduleDto(breakStart = Patch.Value(null))
            )
        }
        assertFailsWith<ValidationException> {
            WorkScheduleValidator.validate(
                existing,
                UpdateWorkScheduleDto(breakEnd = Patch.Value(null))
            )
        }
        WorkScheduleValidator.validate(existing, UpdateWorkScheduleDto())
        WorkScheduleValidator.validate(
            existing,
            UpdateWorkScheduleDto(breakStart = Patch.Value(null), breakEnd = Patch.Value(null))
        )
        WorkScheduleValidator.validate(existing, UpdateWorkScheduleDto(breakStart = Patch.Value(LocalTime.of(11, 0))))
    }
}
