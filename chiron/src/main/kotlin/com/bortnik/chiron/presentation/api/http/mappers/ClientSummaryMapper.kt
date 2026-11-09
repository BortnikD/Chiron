package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.client.ClientSummaryDto
import com.bortnik.chiron.presentation.api.http.dto.response.ClientSummaryResponse

fun ClientSummaryDto.toResponse(): ClientSummaryResponse = ClientSummaryResponse(
    activePets = activePets,
    upcomingAppointments = upcomingAppointments,
    completedAppointments = completedAppointments,
    vaccinationsDue = vaccinationsDue,
    vaccinationsOverdue = vaccinationsOverdue,
    unreadNotifications = unreadNotifications,
    nextAppointment = nextAppointment?.toResponse(),
)
