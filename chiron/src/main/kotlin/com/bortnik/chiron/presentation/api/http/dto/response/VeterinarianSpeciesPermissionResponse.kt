package com.bortnik.chiron.presentation.api.http.dto.response

import java.util.UUID

data class VeterinarianSpeciesPermissionResponse(
    val veterinarianId: UUID,
    val speciesId: UUID,
)
