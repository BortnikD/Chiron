package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class SpeciesStatisticsResponse(
    val speciesId: UUID,
    val name: String,
    val activePets: Long,
    val appointments: Long,
    val revenue: Double,
)
