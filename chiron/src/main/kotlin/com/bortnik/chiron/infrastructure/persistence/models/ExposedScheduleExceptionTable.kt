package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.ENUM_LENGTH
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.date
import org.jetbrains.exposed.v1.javatime.time

object ExposedScheduleExceptionTable : UUIDTable("schedule_exception") {
    val veterinarianId = reference("veterinarian_id", ExposedVeterinarianTable)
    val type = enumerationByName<ScheduleExceptionType>("type", ENUM_LENGTH)
    val startDate = date("start_date")
    val endDate = date("end_date")
    val startTime = time("start_time").nullable()
    val endTime = time("end_time").nullable()
    val reason = text("reason").nullable()
}
