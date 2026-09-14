package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.time

object ExposedWorkScheduleTable : UUIDTable("work_schedule") {
    val veterinarianId = reference("veterinarian_id", ExposedVeterinarianTable)
    val dayOfWeek = integer("day_of_week")
    val startTime = time("start_time")
    val endTime = time("end_time")
    val breakStart = time("break_start").nullable()
    val breakEnd = time("break_end").nullable()
}
