package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant
import java.util.UUID

data class AppointmentInterval(
    val id: UUID,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
)
