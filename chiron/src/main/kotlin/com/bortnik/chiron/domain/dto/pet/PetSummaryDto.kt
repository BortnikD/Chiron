package com.bortnik.chiron.domain.dto.pet

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class PetNextAppointmentDto(
    val id: UUID,
    val startAt: Instant,
    val serviceId: UUID,
)

data class PetSummaryDto(
    val completedVisits: Long = 0,
    val appointmentsCount: Long = 0,
    val vaccinationsCount: Long = 0,
    val nextAppointment: PetNextAppointmentDto? = null,
    val nextVaccinationDueOn: LocalDate? = null,
    val hasOverdueVaccination: Boolean = false,
)
