package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.CreateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.UpdateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse

fun Veterinarian.toResponse(): VeterinarianResponse = VeterinarianResponse(
    id = id,
    userId = userId,
    specializationId = specializationId,
    bio = bio,
    photoUrl = photoUrl,
    experienceYears = experienceYears,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun CreateVeterinarianRequest.toDto(): CreateVeterinarianDto = CreateVeterinarianDto(
    userId = userId,
    specializationId = specializationId,
    bio = bio,
    photoUrl = photoUrl,
    experienceYears = experienceYears,
    isActive = isActive,
)

fun UpdateVeterinarianRequest.toDto(): UpdateVeterinarianDto = UpdateVeterinarianDto(
    specializationId = specializationId,
    bio = bio,
    photoUrl = photoUrl,
    experienceYears = experienceYears,
    isActive = isActive,
)
