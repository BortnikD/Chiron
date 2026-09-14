package com.bortnik.chiron.domain.dto.workschedule

import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID

data class CreateWorkScheduleDto(
    val veterinarianId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime? = null,
    val breakEnd: LocalTime? = null,
)
