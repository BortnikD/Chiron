package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianSpeciesPermissionResponse

fun VeterinarianSpeciesPermission.toResponse(): VeterinarianSpeciesPermissionResponse =
    VeterinarianSpeciesPermissionResponse(
        veterinarianId = veterinarianId,
        speciesId = speciesId,
    )
