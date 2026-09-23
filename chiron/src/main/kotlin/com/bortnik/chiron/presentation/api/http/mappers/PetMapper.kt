package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.pet.CreateOwnPetDto
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.presentation.api.http.dto.request.pet.ClientCreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.CreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse

fun Pet.toResponse(): PetResponse = PetResponse(
    id = id,
    name = name,
    ownerId = ownerId,
    speciesId = speciesId,
    birthDate = birthDate,
    weightKg = weightKg,
    gender = gender,
    notes = notes,
    isArchived = isArchived,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun CreatePetRequest.toDto(): CreatePetDto = CreatePetDto(
    name = name,
    ownerId = ownerId,
    speciesId = speciesId,
    birthDate = birthDate,
    weightKg = weightKg,
    gender = gender,
    notes = notes,
)

fun ClientCreatePetRequest.toDto(): CreateOwnPetDto = CreateOwnPetDto(
    name = name,
    speciesId = speciesId,
    birthDate = birthDate,
    weightKg = weightKg,
    gender = gender,
    notes = notes,
)

fun UpdatePetRequest.toDto(): UpdatePetDto = UpdatePetDto(
    name = name,
    speciesId = speciesId,
    birthDate = birthDate,
    weightKg = weightKg,
    gender = gender,
    notes = notes,
    isArchived = isArchived,
)
