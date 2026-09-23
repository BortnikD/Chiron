package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentStatusDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianUpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse

fun Appointment.toResponse(): AppointmentResponse = AppointmentResponse(
    id = id,
    veterinarianId = veterinarianId,
    petId = petId,
    serviceId = serviceId,
    followUpOf = followUpOf,
    startAt = startAt,
    endAt = endAt,
    status = status,
    priceSnapshot = priceSnapshot,
    clientComment = clientComment,
    vetNotes = vetNotes,
    cancelledBy = cancelledBy,
    cancelledAt = cancelledAt,
    cancelReason = cancelReason,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun CreateAppointmentRequest.toDto(): CreateAppointmentDto = CreateAppointmentDto(
    veterinarianId = veterinarianId,
    petId = petId,
    serviceId = serviceId,
    followUpOf = followUpOf,
    startAt = startAt,
    endAt = endAt,
    status = status,
    priceSnapshot = priceSnapshot,
    clientComment = clientComment,
)

fun ClientCreateAppointmentRequest.toDto(): BookAppointmentDto = BookAppointmentDto(
    veterinarianId = veterinarianId,
    petId = petId,
    serviceId = serviceId,
    startAt = startAt,
    endAt = endAt,
    clientComment = clientComment,
)

fun UpdateAppointmentRequest.toDto(): UpdateAppointmentDto = UpdateAppointmentDto(
    veterinarianId = veterinarianId,
    startAt = startAt,
    endAt = endAt,
    status = status,
    clientComment = clientComment,
    vetNotes = vetNotes,
    cancelledBy = cancelledBy,
    cancelledAt = cancelledAt,
    cancelReason = cancelReason,
)

fun VeterinarianUpdateAppointmentRequest.toDto(): UpdateAppointmentStatusDto = UpdateAppointmentStatusDto(
    status = status,
    vetNotes = vetNotes,
    cancelReason = cancelReason,
)
