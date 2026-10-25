package com.bortnik.chiron.domain.dto.statistics

import java.util.UUID

data class VeterinarianStatistics(
    val veterinarianId: UUID,
    val fullName: String,
    val appointments: AppointmentTotals,
)
