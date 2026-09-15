package com.bortnik.chiron.presentation.api.http.dto.request.servicespecies

import java.util.UUID

data class CreateServiceSpeciesRequest(
    val speciesId: UUID,
    val durationMin: Int? = null,
    val price: Double? = null,
)
