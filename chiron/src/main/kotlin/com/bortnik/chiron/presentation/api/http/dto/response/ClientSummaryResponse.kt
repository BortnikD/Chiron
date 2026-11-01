package com.bortnik.chiron.presentation.api.http.dto.response

data class ClientSummaryResponse(
    val activePets: Long,
    val upcomingAppointments: Long,
    val completedAppointments: Long,
    val vaccinationsDue: Long,
    val vaccinationsOverdue: Long,
    val unreadNotifications: Long,
    val nextAppointment: AppointmentResponse?,
)
