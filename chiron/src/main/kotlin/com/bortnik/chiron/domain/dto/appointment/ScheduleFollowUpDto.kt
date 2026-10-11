package com.bortnik.chiron.domain.dto.appointment

import java.time.Instant
import java.util.UUID

// What a veterinarian sends to schedule a follow-up: the pet, the veterinarian, the price and the status
// are decided by the application; a null serviceId keeps the service of the original appointment.
data class ScheduleFollowUpDto(
    val serviceId: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
)
