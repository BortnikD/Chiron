package com.bortnik.chiron.presentation.api.http.dto.response

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonUnwrapped
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class ClientPetResponse(
    @get:JsonUnwrapped
    val pet: PetResponse,
    @get:JsonInclude(JsonInclude.Include.NON_NULL)
    val summary: PetSummaryResponse?,
)

data class PetNextAppointmentResponse(
    val id: UUID,
    val startAt: Instant,
    val serviceId: UUID,
)

data class PetSummaryResponse(
    val completedVisits: Long,
    val appointmentsCount: Long,
    val vaccinationsCount: Long,
    val nextAppointment: PetNextAppointmentResponse?,
    val nextVaccinationDueOn: LocalDate?,
    val hasOverdueVaccination: Boolean,
)
