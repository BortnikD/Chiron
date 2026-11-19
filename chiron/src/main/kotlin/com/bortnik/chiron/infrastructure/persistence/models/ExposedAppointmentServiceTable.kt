package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_PRECISION
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_SCALE
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedAppointmentServiceTable : Table("appointment_service") {
    val appointmentId = reference("appointment_id", ExposedAppointmentTable, onDelete = ReferenceOption.CASCADE)
    val serviceId = reference("service_id", ExposedServiceTable)
    val nameSnapshot = text("name_snapshot")
    val priceSnapshot = decimal("price_snapshot", DECIMAL_PRECISION, DECIMAL_SCALE)
    val durationMinSnapshot = integer("duration_min_snapshot").nullable()
    val bufferAfterMinSnapshot = integer("buffer_after_min_snapshot").nullable()
    val isPlanned = bool("is_planned")
    val isPerformed = bool("is_performed").nullable()
    val addedBy = optReference("added_by", ExposedUserTable, onDelete = ReferenceOption.SET_NULL)
    val createdAt = timestampWithTimeZone("created_at")
    val updatedBy = optReference("updated_by", ExposedUserTable, onDelete = ReferenceOption.SET_NULL)
    val updatedAt = timestampWithTimeZone("updated_at")

    override val primaryKey = PrimaryKey(appointmentId, serviceId)
}
