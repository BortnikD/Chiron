package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ClientAppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentStatusDto
import com.bortnik.chiron.domain.dto.appointment.VeterinarianAppointmentFilter
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.AppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientAppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianAppointmentFilterRequest
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
    clientComment = clientComment.toPatch(),
    vetNotes = vetNotes.toPatch(),
    cancelledBy = cancelledBy.toPatch(),
    cancelledAt = cancelledAt.toPatch(),
    cancelReason = cancelReason.toPatch(),
)

fun VeterinarianUpdateAppointmentRequest.toDto(): UpdateAppointmentStatusDto = UpdateAppointmentStatusDto(
    status = status,
    vetNotes = vetNotes.toPatch(),
    cancelReason = cancelReason,
)

fun AppointmentFilterRequest.toDto(): AppointmentFilter = AppointmentFilter(
    veterinarianId = veterinarianId,
    petId = petId,
    ownerId = ownerId,
    serviceId = serviceId,
    statuses = status?.takeIf { it.isNotEmpty() },
    from = from,
    to = to,
)

fun ClientAppointmentFilterRequest.toDto(): ClientAppointmentFilter = ClientAppointmentFilter(
    petId = petId,
    statuses = status?.takeIf { it.isNotEmpty() },
    from = from,
    to = to,
)

fun VeterinarianAppointmentFilterRequest.toDto(): VeterinarianAppointmentFilter = VeterinarianAppointmentFilter(
    petId = petId,
    statuses = status?.takeIf { it.isNotEmpty() },
    from = from,
    to = to,
)
