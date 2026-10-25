package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class ServiceStatisticsResponse(
    val serviceId: UUID,
    val name: String,
    val specializationName: String,
    val appointments: Long,
    val completed: Long,
    val revenue: Double,
)
