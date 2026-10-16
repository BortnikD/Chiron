package com.bortnik.chiron.domain.dto.appointment

import java.time.Instant
import java.util.UUID

data class AvailableSlot(
    val startAt: Instant,
    val endAt: Instant,
    val veterinarianIds: List<UUID>,
)
