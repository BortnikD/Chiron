package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.entities.Service as ServiceEntity
import com.bortnik.chiron.presentation.api.http.dto.request.service.CreateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.request.service.UpdateServiceRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceResponse

fun ServiceEntity.toResponse(): ServiceResponse = ServiceResponse(
    id = id,
    specializationId = specializationId,
    name = name,
    description = description,
    basePrice = basePrice,
    baseDurationMin = baseDurationMin,
    bufferAfterMin = bufferAfterMin,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun CreateServiceRequest.toDto(): CreateServiceDto = CreateServiceDto(
    specializationId = specializationId,
    name = name,
    description = description,
    basePrice = basePrice,
    baseDurationMin = baseDurationMin,
    bufferAfterMin = bufferAfterMin,
    isActive = isActive,
)

fun UpdateServiceRequest.toDto(): UpdateServiceDto = UpdateServiceDto(
    specializationId = specializationId,
    name = name,
    description = description,
    basePrice = basePrice,
    baseDurationMin = baseDurationMin,
    bufferAfterMin = bufferAfterMin,
    isActive = isActive,
)
