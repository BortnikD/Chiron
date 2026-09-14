package com.bortnik.chiron.domain.entities

import java.util.UUID

data class VeterinarianSpeciesPermission(
    val veterinarianId: UUID,
    val speciesId: UUID,
)
