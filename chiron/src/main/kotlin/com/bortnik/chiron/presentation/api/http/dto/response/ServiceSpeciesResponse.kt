package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class ServiceSpeciesResponse(
    val serviceId: UUID,
    val speciesId: UUID,
    val durationMin: Int?,
    val price: Double?,
)
