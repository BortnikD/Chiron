package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AvailableSlot
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ClientAppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ScheduleFollowUpDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentStatusDto
import com.bortnik.chiron.domain.dto.appointment.VeterinarianAppointmentFilter
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.AppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientAppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianAppointmentFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianCreateFollowUpRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.VeterinarianUpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentServiceResponse
import com.bortnik.chiron.presentation.api.http.dto.response.AvailableSlotResponse

fun Appointment.toResponse(): AppointmentResponse = AppointmentResponse(
    id = id,
    veterinarianId = veterinarianId,
    petId = petId,
    services = services.map { it.toResponse() },
    followUpOf = followUpOf,
    startAt = startAt,
    endAt = endAt,
    status = status,
    estimatedTotal = estimatedTotal,
    actualTotal = actualTotal,
    durationMin = durationMin,
    bufferAfterMin = bufferAfterMin,
    clientComment = clientComment,
    vetNotes = vetNotes,
    cancelledBy = cancelledBy,
    cancelledAt = cancelledAt,
    cancelReason = cancelReason,
    createdAt = createdAt,
    updatedAt = updatedAt,
)

fun AppointmentService.toResponse(): AppointmentServiceResponse = AppointmentServiceResponse(
    serviceId = serviceId,
    nameSnapshot = nameSnapshot,
    priceSnapshot = priceSnapshot,
    durationMinSnapshot = durationMinSnapshot,
    bufferAfterMinSnapshot = bufferAfterMinSnapshot,
    isPlanned = isPlanned,
    isPerformed = isPerformed,
    addedBy = addedBy,
    createdAt = createdAt,
    updatedBy = updatedBy,
    updatedAt = updatedAt,
)

fun AvailableSlot.toResponse(): AvailableSlotResponse = AvailableSlotResponse(
    startAt = startAt,
    endAt = endAt,
    veterinarianIds = veterinarianIds,
)

fun CreateAppointmentRequest.toDto(): CreateAppointmentDto = CreateAppointmentDto(
    veterinarianId = veterinarianId,
    petId = petId,
    serviceIds = serviceIds,
    followUpOf = followUpOf,
    startAt = startAt,
    endAt = endAt,
    status = status,
    clientComment = clientComment,
)

fun ClientCreateAppointmentRequest.toDto(): BookAppointmentDto = BookAppointmentDto(
    veterinarianId = veterinarianId,
    petId = petId,
    serviceIds = serviceIds,
    startAt = startAt,
    endAt = endAt,
    clientComment = clientComment,
)

fun UpdateAppointmentRequest.toDto(): UpdateAppointmentDto = UpdateAppointmentDto(
    veterinarianId = veterinarianId,
    startAt = startAt,
    endAt = endAt,
    status = status,
    serviceIds = serviceIds,
    performedServiceIds = performedServiceIds,
    clientComment = clientComment.toPatch(),
    vetNotes = vetNotes.toPatch(),
    cancelledBy = cancelledBy.toPatch(),
    cancelledAt = cancelledAt.toPatch(),
    cancelReason = cancelReason.toPatch(),
)

fun VeterinarianUpdateAppointmentRequest.toDto(): UpdateAppointmentStatusDto = UpdateAppointmentStatusDto(
    status = status,
    serviceIds = serviceIds,
    performedServiceIds = performedServiceIds,
    endAt = endAt,
    vetNotes = vetNotes.toPatch(),
    cancelReason = cancelReason,
)

fun VeterinarianCreateFollowUpRequest.toDto(): ScheduleFollowUpDto = ScheduleFollowUpDto(
    serviceIds = serviceIds,
    startAt = startAt,
    endAt = endAt,
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
    direction = direction,
)

fun VeterinarianAppointmentFilterRequest.toDto(): VeterinarianAppointmentFilter = VeterinarianAppointmentFilter(
    petId = petId,
    statuses = status?.takeIf { it.isNotEmpty() },
    from = from,
    to = to,
)
