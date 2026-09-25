package com.bortnik.chiron.domain.dto.scheduleexception

import com.bortnik.chiron.domain.entities.enums.ScheduleExceptionType
import java.time.LocalDate
import java.util.UUID

// Null fields are not filtered on; from / to keep exceptions whose inclusive date range overlaps [from, to].
data class ScheduleExceptionFilter(
    val veterinarianId: UUID? = null,
    val type: ScheduleExceptionType? = null,
    val from: LocalDate? = null,
    val to: LocalDate? = null,
)
