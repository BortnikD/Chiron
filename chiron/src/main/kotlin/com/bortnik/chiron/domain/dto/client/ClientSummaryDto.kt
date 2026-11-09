package com.bortnik.chiron.domain.dto.client

import com.bortnik.chiron.domain.entities.Appointment

data class ClientAppointmentTotalsDto(
    val upcoming: Long = 0,
    val completed: Long = 0,
)

data class ClientVaccinationTotalsDto(
    val due: Long = 0,
    val overdue: Long = 0,
)

data class ClientSummaryDto(
    val activePets: Long,
    val upcomingAppointments: Long,
    val completedAppointments: Long,
    val vaccinationsDue: Long,
    val vaccinationsOverdue: Long,
    val unreadNotifications: Long,
    val nextAppointment: Appointment?,
)
