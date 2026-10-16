package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.dto.vaccination.VeterinarianVaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.UpdateVaccinationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.VaccinationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.VeterinarianVaccinationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse

fun Vaccination.toResponse(): VaccinationResponse = VaccinationResponse(
    id = id,
    petId = petId,
    appointmentId = appointmentId,
    name = name,
    administeredOn = administeredOn,
    nextDueOn = nextDueOn,
)

fun CreateVaccinationRequest.toDto(): CreateVaccinationDto = CreateVaccinationDto(
    petId = petId,
    appointmentId = appointmentId,
    name = name,
    administeredOn = administeredOn,
    nextDueOn = nextDueOn,
)

fun UpdateVaccinationRequest.toDto(): UpdateVaccinationDto = UpdateVaccinationDto(
    name = name,
    administeredOn = administeredOn,
    nextDueOn = nextDueOn.toPatch(),
)

fun VaccinationFilterRequest.toDto(): VaccinationFilter = VaccinationFilter(
    petId = petId,
    name = name?.trim()?.takeIf { it.isNotEmpty() },
    nextDueFrom = nextDueFrom,
    nextDueTo = nextDueTo,
)

fun VeterinarianVaccinationFilterRequest.toDto(): VeterinarianVaccinationFilter = VeterinarianVaccinationFilter(
    petId = petId,
    name = name?.trim()?.takeIf { it.isNotEmpty() },
    nextDueFrom = nextDueFrom,
    nextDueTo = nextDueTo,
)
