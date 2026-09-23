package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.CreateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.UpdateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ScheduleExceptionResponse

fun ScheduleException.toResponse(): ScheduleExceptionResponse = ScheduleExceptionResponse(
    id = id,
    veterinarianId = veterinarianId,
    type = type,
    startDate = startDate,
    endDate = endDate,
    startTime = startTime,
    endTime = endTime,
    reason = reason,
)

fun CreateScheduleExceptionRequest.toDto(): CreateScheduleExceptionDto = CreateScheduleExceptionDto(
    veterinarianId = veterinarianId,
    type = type,
    startDate = startDate,
    endDate = endDate,
    startTime = startTime,
    endTime = endTime,
    reason = reason,
)

fun UpdateScheduleExceptionRequest.toDto(): UpdateScheduleExceptionDto = UpdateScheduleExceptionDto(
    type = type,
    startDate = startDate,
    endDate = endDate,
    startTime = startTime.toPatch(),
    endTime = endTime.toPatch(),
    reason = reason.toPatch(),
)
