package com.bortnik.chiron.domain.dto.workschedule

import java.time.LocalTime

data class UpdateWorkScheduleDto(
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime? = null,
    val breakEnd: LocalTime? = null,
)
