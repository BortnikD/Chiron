package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateOwnVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.CreateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.UpdateVeterinarianRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.VeterinarianFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.VeterinarianUpdateProfileRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse

fun VeterinarianDetailsDto.toResponse(): VeterinarianResponse = VeterinarianResponse(
    id = veterinarian.id,
    userId = veterinarian.userId,
    firstName = firstName,
    middleName = middleName,
    lastName = lastName,
    fullName = fullName,
    specializationId = veterinarian.specializationId,
    bio = veterinarian.bio,
    photoUrl = veterinarian.photoUrl,
    experienceYears = veterinarian.experienceYears,
    isActive = veterinarian.isActive,
    createdAt = veterinarian.createdAt,
    updatedAt = veterinarian.updatedAt,
    speciesIds = speciesIds,
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
    bio = bio.toPatch(),
    photoUrl = photoUrl.toPatch(),
    experienceYears = experienceYears,
    isActive = isActive,
)

fun VeterinarianUpdateProfileRequest.toDto(): UpdateOwnVeterinarianDto = UpdateOwnVeterinarianDto(
    bio = bio.toPatch(),
    photoUrl = photoUrl.toPatch(),
    experienceYears = experienceYears,
)

fun VeterinarianFilterRequest.toDto(): VeterinarianFilter = VeterinarianFilter(
    specializationId = specializationId,
    speciesId = speciesId,
    isActive = isActive,
)
