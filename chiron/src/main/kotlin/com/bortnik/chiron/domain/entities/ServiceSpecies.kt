package com.bortnik.chiron.domain.entities

import java.util.UUID

data class ServiceSpecies(
    val serviceId: UUID,
    val speciesId: UUID,
    val durationMin: Int? = null,
    val price: Double? = null,
)
