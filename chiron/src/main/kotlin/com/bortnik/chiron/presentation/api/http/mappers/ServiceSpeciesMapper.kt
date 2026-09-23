package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.servicespecies.UpdateServiceSpeciesDto
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.presentation.api.http.dto.request.servicespecies.CreateServiceSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.request.servicespecies.UpdateServiceSpeciesRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceSpeciesResponse
import java.util.UUID

fun ServiceSpecies.toResponse(): ServiceSpeciesResponse = ServiceSpeciesResponse(
    serviceId = serviceId,
    speciesId = speciesId,
    durationMin = durationMin,
    price = price,
)

fun CreateServiceSpeciesRequest.toDomain(serviceId: UUID): ServiceSpecies = ServiceSpecies(
    serviceId = serviceId,
    speciesId = speciesId,
    durationMin = durationMin,
    price = price,
)

fun UpdateServiceSpeciesRequest.toDto(): UpdateServiceSpeciesDto = UpdateServiceSpeciesDto(
    durationMin = durationMin.toPatch(),
    price = price.toPatch(),
)
