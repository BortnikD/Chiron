package com.bortnik.chiron.infrastructure.persistence.models

import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_PRECISION
import com.bortnik.chiron.infrastructure.persistence.models.ExposedColumnConstants.DECIMAL_SCALE
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object ExposedServiceTable : UUIDTable("service") {
    val specializationId = reference("specialization_id", ExposedSpecializationTable)
    val name = text("name")
    val description = text("description")
    val basePrice = decimal("base_price", DECIMAL_PRECISION, DECIMAL_SCALE)
    val baseDurationMin = integer("base_duration_min")
    val bufferAfterMin = integer("buffer_after_min")
    val isActive = bool("is_active")
    val createdAt = timestampWithTimeZone("created_at")
    val updatedAt = timestampWithTimeZone("updated_at")
}
