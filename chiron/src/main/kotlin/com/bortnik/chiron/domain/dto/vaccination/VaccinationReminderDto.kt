package com.bortnik.chiron.domain.dto.vaccination

import com.bortnik.chiron.domain.entities.Vaccination
import java.util.UUID

data class VaccinationReminderDto(
    val vaccination: Vaccination,
    val ownerId: UUID,
    val petName: String,
)
