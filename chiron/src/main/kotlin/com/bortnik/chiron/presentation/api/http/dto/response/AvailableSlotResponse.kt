package com.bortnik.chiron.presentation.api.http.dto.response

import java.time.Instant
import java.util.UUID

data class AvailableSlotResponse(
    val startAt: Instant,
    val endAt: Instant,
    val veterinarianIds: List<UUID>,
)
