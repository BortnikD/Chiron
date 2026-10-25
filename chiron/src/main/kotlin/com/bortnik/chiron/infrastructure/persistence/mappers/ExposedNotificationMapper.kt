package com.bortnik.chiron.infrastructure.persistence.mappers

import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.infrastructure.persistence.models.ExposedNotificationTable
import org.jetbrains.exposed.v1.core.ResultRow

fun ResultRow.toNotification(): Notification = Notification(
    id = this[ExposedNotificationTable.id].value,
    recipientId = this[ExposedNotificationTable.recipientId].value,
    actorId = this[ExposedNotificationTable.actorId]?.value,
    type = this[ExposedNotificationTable.type],
    title = this[ExposedNotificationTable.title],
    body = this[ExposedNotificationTable.body],
    appointmentId = this[ExposedNotificationTable.appointmentId]?.value,
    petId = this[ExposedNotificationTable.petId]?.value,
    vaccinationId = this[ExposedNotificationTable.vaccinationId]?.value,
    readAt = this[ExposedNotificationTable.readAt]?.toInstant(),
    createdAt = this[ExposedNotificationTable.createdAt].toInstant(),
)
