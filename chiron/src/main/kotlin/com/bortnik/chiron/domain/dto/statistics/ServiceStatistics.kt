package com.bortnik.chiron.domain.dto.statistics

import java.util.UUID

data class ServiceStatistics(
    val serviceId: UUID,
    val name: String,
    val specializationName: String,
    val appointments: AppointmentTotals,
)
