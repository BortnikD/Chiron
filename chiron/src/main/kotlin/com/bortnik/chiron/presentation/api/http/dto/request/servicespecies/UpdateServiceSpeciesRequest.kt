package com.bortnik.chiron.presentation.api.http.dto.request.servicespecies

data class UpdateServiceSpeciesRequest(
    val durationMin: Int? = null,
    val price: Double? = null,
)
