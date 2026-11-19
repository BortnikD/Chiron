package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentServiceTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toAppointment(services: List<AppointmentService>): Appointment = Appointment(
    id = this[ExposedAppointmentTable.id].value,
    veterinarianId = this[ExposedAppointmentTable.veterinarianId].value,
    petId = this[ExposedAppointmentTable.petId].value,
    services = services,
    followUpOf = this[ExposedAppointmentTable.followUpOf]?.value,
    startAt = this[ExposedAppointmentTable.startAt].toInstant(),
    endAt = this[ExposedAppointmentTable.endAt].toInstant(),
    status = this[ExposedAppointmentTable.status],
    clientComment = this[ExposedAppointmentTable.clientComment],
    vetNotes = this[ExposedAppointmentTable.vetNotes],
    cancelledBy = this[ExposedAppointmentTable.cancelledBy]?.value,
    cancelledAt = this[ExposedAppointmentTable.cancelledAt]?.toInstant(),
    cancelReason = this[ExposedAppointmentTable.cancelReason],
    createdAt = this[ExposedAppointmentTable.createdAt].toInstant(),
    updatedAt = this[ExposedAppointmentTable.updatedAt].toInstant(),
)

fun ResultRow.toAppointmentService(): AppointmentService = AppointmentService(
    serviceId = this[ExposedAppointmentServiceTable.serviceId].value,
    nameSnapshot = this[ExposedAppointmentServiceTable.nameSnapshot],
    priceSnapshot = this[ExposedAppointmentServiceTable.priceSnapshot].toDouble(),
    durationMinSnapshot = this[ExposedAppointmentServiceTable.durationMinSnapshot],
    bufferAfterMinSnapshot = this[ExposedAppointmentServiceTable.bufferAfterMinSnapshot],
    isPlanned = this[ExposedAppointmentServiceTable.isPlanned],
    isPerformed = this[ExposedAppointmentServiceTable.isPerformed],
    addedBy = this[ExposedAppointmentServiceTable.addedBy]?.value,
    createdAt = this[ExposedAppointmentServiceTable.createdAt].toInstant(),
    updatedBy = this[ExposedAppointmentServiceTable.updatedBy]?.value,
    updatedAt = this[ExposedAppointmentServiceTable.updatedAt].toInstant(),
)
