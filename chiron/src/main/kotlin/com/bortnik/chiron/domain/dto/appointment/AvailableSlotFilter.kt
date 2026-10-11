package com.bortnik.chiron.domain.dto.appointment

import java.time.LocalDate
import java.util.UUID

// from / to are dates in the clinic time zone, both inclusive; a null veterinarianId searches all veterinarians.
data class AvailableSlotFilter(
    val speciesId: UUID,
    val serviceId: UUID,
    val veterinarianId: UUID? = null,
    val from: LocalDate,
    val to: LocalDate,
)
