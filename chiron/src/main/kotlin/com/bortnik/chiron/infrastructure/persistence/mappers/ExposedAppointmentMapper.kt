package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toAppointment(): Appointment = Appointment(
    id = this[ExposedAppointmentTable.id].value,
    veterinarianId = this[ExposedAppointmentTable.veterinarianId].value,
    petId = this[ExposedAppointmentTable.petId].value,
    serviceId = this[ExposedAppointmentTable.serviceId].value,
    followUpOf = this[ExposedAppointmentTable.followUpOf]?.value,
    startAt = this[ExposedAppointmentTable.startAt].toInstant(),
    endAt = this[ExposedAppointmentTable.endAt].toInstant(),
    status = this[ExposedAppointmentTable.status],
    priceSnapshot = this[ExposedAppointmentTable.priceSnapshot].toDouble(),
    clientComment = this[ExposedAppointmentTable.clientComment],
    vetNotes = this[ExposedAppointmentTable.vetNotes],
    cancelledBy = this[ExposedAppointmentTable.cancelledBy]?.value,
    cancelledAt = this[ExposedAppointmentTable.cancelledAt]?.toInstant(),
    cancelReason = this[ExposedAppointmentTable.cancelReason],
    createdAt = this[ExposedAppointmentTable.createdAt].toInstant(),
    updatedAt = this[ExposedAppointmentTable.updatedAt].toInstant(),
)
