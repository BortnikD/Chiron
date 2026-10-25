package com.bortnik.chiron.domain.dto.statistics

import java.util.UUID

// activePets is the current number of non-archived pets, not bound to the period.
data class SpeciesStatistics(
    val speciesId: UUID,
    val name: String,
    val activePets: Long,
    val appointments: AppointmentTotals,
)
