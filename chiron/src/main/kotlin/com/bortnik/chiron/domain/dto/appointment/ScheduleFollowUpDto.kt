package com.bortnik.chiron.domain.dto.appointment

import java.time.Instant
import java.util.UUID

data class ScheduleFollowUpDto(
    val serviceIds: List<UUID>,
    val startAt: Instant,
    val endAt: Instant,
)
