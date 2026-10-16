package com.bortnik.chiron.presentation.api.http.dto.request.appointment

import java.time.Instant
import java.util.UUID

data class VeterinarianCreateFollowUpRequest(
    val serviceId: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
)
