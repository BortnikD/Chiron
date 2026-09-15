package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import com.bortnik.chiron.presentation.api.http.dto.request.species.CreateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.species.UpdateSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesResponse

fun Species.toResponse(): SpeciesResponse = SpeciesResponse(
    id = id,
    name = name,
)

fun CreateSpeciesRequest.toDto(): CreateSpeciesDto = CreateSpeciesDto(
    name = name,
)

fun UpdateSpeciesRequest.toDto(): UpdateSpeciesDto = UpdateSpeciesDto(
    name = name,
)
