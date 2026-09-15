package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.CreateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.UpdateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.response.WorkScheduleResponse

fun WorkSchedule.toResponse(): WorkScheduleResponse = WorkScheduleResponse(
    id = id,
    veterinarianId = veterinarianId,
    dayOfWeek = dayOfWeek,
    startTime = startTime,
    endTime = endTime,
    breakStart = breakStart,
    breakEnd = breakEnd,
)

fun CreateWorkScheduleRequest.toDto(): CreateWorkScheduleDto = CreateWorkScheduleDto(
    veterinarianId = veterinarianId,
    dayOfWeek = dayOfWeek,
    startTime = startTime,
    endTime = endTime,
    breakStart = breakStart,
    breakEnd = breakEnd,
)

fun UpdateWorkScheduleRequest.toDto(): UpdateWorkScheduleDto = UpdateWorkScheduleDto(
    startTime = startTime,
    endTime = endTime,
    breakStart = breakStart,
    breakEnd = breakEnd,
)
