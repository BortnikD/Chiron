package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.CreateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.specialization.UpdateSpecializationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.SpecializationResponse

fun Specialization.toResponse(): SpecializationResponse = SpecializationResponse(
    id = id,
    name = name,
    description = description,
)

fun CreateSpecializationRequest.toDto(): CreateSpecializationDto = CreateSpecializationDto(
    name = name,
    description = description,
)

fun UpdateSpecializationRequest.toDto(): UpdateSpecializationDto = UpdateSpecializationDto(
    name = name,
    description = description,
)
