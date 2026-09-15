package com.bortnik.chiron.presentation.api.http.dto.request.workschedule

import java.time.LocalTime

data class UpdateWorkScheduleRequest(
    val startTime: LocalTime,
    val endTime: LocalTime,
    val breakStart: LocalTime? = null,
    val breakEnd: LocalTime? = null,
)
