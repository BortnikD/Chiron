package com.bortnik.chiron.domain.entities

import java.time.LocalDate
import java.util.UUID

data class Vaccination(
    val id: UUID,
    val petId: UUID,
    val appointmentId: UUID? = null,
    val name: String,
    val administeredOn: LocalDate,
    val nextDueOn: LocalDate? = null,
)
