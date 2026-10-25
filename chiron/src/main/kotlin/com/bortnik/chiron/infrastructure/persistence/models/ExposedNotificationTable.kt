package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.ENUM_LENGTH
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedNotificationTable : UUIDTable("notification") {
    val recipientId = reference("recipient_id", ExposedUserTable)
    val actorId = optReference("actor_id", ExposedUserTable)
    val type = enumerationByName<NotificationType>("type", ENUM_LENGTH)
    val title = text("title")
    val body = text("body")
    val appointmentId = optReference("appointment_id", ExposedAppointmentTable)
    val petId = optReference("pet_id", ExposedPetTable)
    val vaccinationId = optReference("vaccination_id", ExposedVaccinationTable)
    val readAt = timestampWithTimeZone("read_at").nullable()
    val createdAt = timestampWithTimeZone("created_at")
}
