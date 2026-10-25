package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.statistics.OverviewStatistics
import com.bortnik.chiron.domain.dto.statistics.ServiceStatistics
import com.bortnik.chiron.domain.dto.statistics.SpeciesStatistics
import com.bortnik.chiron.domain.dto.statistics.TimelinePoint
import com.bortnik.chiron.domain.dto.statistics.VeterinarianStatistics
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.presentation.api.http.dto.response.OverviewStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.TimelinePointResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianStatisticsResponse

fun OverviewStatistics.toResponse(): OverviewStatisticsResponse = OverviewStatisticsResponse(
    totalAppointments = appointments.total,
    appointmentsByStatus = AppointmentStatus.entries.associateWith { appointments.count(it) },
    revenue = appointments.revenue,
    expectedRevenue = appointments.expectedRevenue,
    averageCheck = appointments.averageCheck,
    cancellationRate = appointments.cancellationRate,
    noShowRate = appointments.noShowRate,
    followUps = followUps,
    newClients = newClients,
    newPets = newPets,
)

fun TimelinePoint.toResponse(): TimelinePointResponse = TimelinePointResponse(
    periodStart = periodStart,
    appointments = appointments.total,
    completed = appointments.count(AppointmentStatus.COMPLETED),
    revenue = appointments.revenue,
)

fun VeterinarianStatistics.toResponse(): VeterinarianStatisticsResponse = VeterinarianStatisticsResponse(
    veterinarianId = veterinarianId,
    fullName = fullName,
    appointments = appointments.total,
    completed = appointments.count(AppointmentStatus.COMPLETED),
    cancelled = appointments.count(AppointmentStatus.CANCELLED),
    noShows = appointments.count(AppointmentStatus.NO_SHOW),
    revenue = appointments.revenue,
)

fun ServiceStatistics.toResponse(): ServiceStatisticsResponse = ServiceStatisticsResponse(
    serviceId = serviceId,
    name = name,
    specializationName = specializationName,
    appointments = appointments.total,
    completed = appointments.count(AppointmentStatus.COMPLETED),
    revenue = appointments.revenue,
)

fun SpeciesStatistics.toResponse(): SpeciesStatisticsResponse = SpeciesStatisticsResponse(
    speciesId = speciesId,
    name = name,
    activePets = activePets,
    appointments = appointments.total,
    revenue = appointments.revenue,
)
