package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.pet.CreateOwnPetDto
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.PetDetailsDto
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.photo.PhotoLinks
import com.bortnik.chiron.presentation.api.http.dto.request.pet.ClientCreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.CreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.PetFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.UpdatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ClientPetResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PetNextAppointmentResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PetSummaryResponse

fun Pet.toResponse(photo: PhotoLinks? = null): PetResponse = PetResponse(
    id = id,
    name = name,
    ownerId = ownerId,
    speciesId = speciesId,
    birthDate = birthDate,
    weightKg = weightKg,
    gender = gender,
    notes = notes,
    isArchived = isArchived,
    photoUrl = photo?.photoUrl,
    photoThumbnailUrl = photo?.photoThumbnailUrl,
    photoUrlExpiresAt = photo?.photoUrlExpiresAt,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun PetDetailsDto.toResponse(photo: PhotoLinks? = null): ClientPetResponse = ClientPetResponse(
    pet = pet.toResponse(photo),
    summary = summary?.let {
        PetSummaryResponse(
            completedVisits = it.completedVisits,
            appointmentsCount = it.appointmentsCount,
            vaccinationsCount = it.vaccinationsCount,
            nextAppointment = it.nextAppointment?.let { appointment ->
                PetNextAppointmentResponse(appointment.id, appointment.startAt, appointment.serviceId)
            },
            nextVaccinationDueOn = it.nextVaccinationDueOn,
            hasOverdueVaccination = it.hasOverdueVaccination,
        )
    },
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
    birthDate = birthDate.toPatch(),
    weightKg = weightKg.toPatch(),
    gender = gender,
    notes = notes.toPatch(),
    isArchived = isArchived,
)

fun PetFilterRequest.toDto(): PetFilter = PetFilter(
    ownerId = ownerId,
    speciesId = speciesId,
    gender = gender,
    isArchived = isArchived,
    name = name?.trim()?.takeIf { it.isNotEmpty() },
)
