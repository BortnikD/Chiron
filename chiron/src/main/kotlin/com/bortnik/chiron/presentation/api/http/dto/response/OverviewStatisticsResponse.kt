package com.bortnik.chiron.presentation.api.http.dto.response

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

data class OverviewStatisticsResponse(
    val totalAppointments: Long,
    val appointmentsByStatus: Map<AppointmentStatus, Long>,
    val revenue: Double,
    val expectedRevenue: Double,
    val averageCheck: Double?,
    val cancellationRate: Double?,
    val noShowRate: Double?,
    val followUps: Long,
    val newClients: Long,
    val newPets: Long,
)
