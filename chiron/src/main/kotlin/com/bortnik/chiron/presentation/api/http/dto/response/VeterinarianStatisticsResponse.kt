package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class VeterinarianStatisticsResponse(
    val veterinarianId: UUID,
    val fullName: String,
    val appointments: Long,
    val completed: Long,
    val cancelled: Long,
    val noShows: Long,
    val revenue: Double,
)
