package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.infrastructure.persistence.models.ExposedScheduleExceptionTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toScheduleException(): ScheduleException = ScheduleException(
    id = this[ExposedScheduleExceptionTable.id].value,
    veterinarianId = this[ExposedScheduleExceptionTable.veterinarianId].value,
    type = this[ExposedScheduleExceptionTable.type],
    startDate = this[ExposedScheduleExceptionTable.startDate],
    endDate = this[ExposedScheduleExceptionTable.endDate],
    startTime = this[ExposedScheduleExceptionTable.startTime],
    endTime = this[ExposedScheduleExceptionTable.endTime],
    reason = this[ExposedScheduleExceptionTable.reason],
)
