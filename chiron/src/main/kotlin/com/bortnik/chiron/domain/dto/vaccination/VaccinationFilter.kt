package com.bortnik.chiron.domain.dto.vaccination

import java.time.LocalDate
import java.util.UUID

// Null fields are not filtered on; name matches a substring of the vaccine name;
// nextDueFrom / nextDueTo bound nextDueOn as [nextDueFrom, nextDueTo], so vaccinations without a next due date
// are excluded when either bound is set. patientOfVeterinarianId keeps only pets with at least one appointment
// with that veterinarian.
data class VaccinationFilter(
    val petId: UUID? = null,
    val patientOfVeterinarianId: UUID? = null,
    val name: String? = null,
    val nextDueFrom: LocalDate? = null,
    val nextDueTo: LocalDate? = null,
)
