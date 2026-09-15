package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.UpdateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import java.time.Instant
import java.util.UUID

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

fun ClientCreateAppointmentRequest.toDto(priceSnapshot: Double): CreateAppointmentDto = CreateAppointmentDto(
    veterinarianId = veterinarianId,
    petId = petId,
    serviceId = serviceId,
    startAt = startAt,
    endAt = endAt,
    priceSnapshot = priceSnapshot,
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

// Keeps every field of the appointment except the status. Cancellation metadata is recorded
// only when the appointment actually moves into CANCELLED, so repeated cancels do not overwrite it.
fun Appointment.toStatusUpdateDto(status: AppointmentStatus, actorId: UUID, cancelReason: String?): UpdateAppointmentDto {
    val dto = UpdateAppointmentDto(
        veterinarianId = veterinarianId,
        startAt = startAt,
        endAt = endAt,
        status = status,
        clientComment = clientComment,
        vetNotes = vetNotes,
        cancelledBy = cancelledBy,
        cancelledAt = cancelledAt,
        cancelReason = this.cancelReason,
    )
    val cancelling = status == AppointmentStatus.CANCELLED && this.status != AppointmentStatus.CANCELLED
    return if (cancelling) dto.copy(cancelledBy = actorId, cancelledAt = Instant.now(), cancelReason = cancelReason) else dto
}
