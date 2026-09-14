package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.infrastructure.persistence.models.ExposedWorkScheduleTable
import org.jetbrains.exposed.v1.core.ResultRow
import java.time.DayOfWeek

fun ResultRow.toWorkSchedule(): WorkSchedule = WorkSchedule(
    id = this[ExposedWorkScheduleTable.id].value,
    veterinarianId = this[ExposedWorkScheduleTable.veterinarianId].value,
    dayOfWeek = DayOfWeek.of(this[ExposedWorkScheduleTable.dayOfWeek]),
    startTime = this[ExposedWorkScheduleTable.startTime],
    endTime = this[ExposedWorkScheduleTable.endTime],
    breakStart = this[ExposedWorkScheduleTable.breakStart],
    breakEnd = this[ExposedWorkScheduleTable.breakEnd],
)
