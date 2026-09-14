package com.bortnik.chiron.domain.entities

import java.time.DayOfWeek
import java.time.LocalTime
import java.util.UUID

data class WorkSchedule(
    val id: UUID,
    val veterinarianId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime? = null,
    val breakEnd: LocalTime? = null,
)
