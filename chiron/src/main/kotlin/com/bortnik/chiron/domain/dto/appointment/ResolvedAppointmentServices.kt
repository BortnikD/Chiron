package com.bortnik.chiron.domain.dto.appointment

import com.bortnik.chiron.domain.entities.AppointmentService
import java.math.BigDecimal
import java.util.UUID

data class ResolvedAppointmentServices(
    val services: List<AppointmentService>,
    val specializationId: UUID,
) {
    val durationMin: Int get() = services.sumOf { requireNotNull(it.durationMinSnapshot) }
    val bufferAfterMin: Int get() = services.maxOf { requireNotNull(it.bufferAfterMinSnapshot) }
    val estimatedTotal: Double
        get() = services.fold(BigDecimal.ZERO) { total, service ->
            total + BigDecimal.valueOf(service.priceSnapshot)
        }.toDouble()
}
