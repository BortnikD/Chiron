package com.bortnik.chiron.domain.dto.statistics

data class OverviewStatistics(
    val appointments: AppointmentTotals,
    val followUps: Long,
    val newClients: Long,
    val newPets: Long,
)
