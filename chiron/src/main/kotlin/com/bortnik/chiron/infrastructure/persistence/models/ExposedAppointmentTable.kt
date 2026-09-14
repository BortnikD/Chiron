package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_PRECISION
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_SCALE
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.ENUM_LENGTH
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedAppointmentTable : UUIDTable("appointment") {
    val veterinarianId = reference("veterinarian_id", ExposedVeterinarianTable)
    val petId = reference("pet_id", ExposedPetTable)
    val serviceId = reference("service_id", ExposedServiceTable)
    val followUpOf = optReference("follow_up_of", ExposedAppointmentTable)
    val startAt = timestampWithTimeZone("start_at")
    val endAt = timestampWithTimeZone("end_at")
    val status = enumerationByName<AppointmentStatus>("status", ENUM_LENGTH)
    val priceSnapshot = decimal("price_snapshot", DECIMAL_PRECISION, DECIMAL_SCALE)
    val clientComment = text("client_comment").nullable()
    val vetNotes = text("vet_notes").nullable()
    val cancelledBy = optReference("cancelled_by", ExposedUserTable)
    val cancelledAt = timestampWithTimeZone("cancelled_at").nullable()
    val cancelReason = text("cancel_reason").nullable()
    val createdAt = timestampWithTimeZone("created_at")
    val updatedAt = timestampWithTimeZone("updated_at")
}
