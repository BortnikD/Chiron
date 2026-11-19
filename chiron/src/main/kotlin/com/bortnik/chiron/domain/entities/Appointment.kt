package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class Appointment(
    val id: UUID,
    val veterinarianId: UUID,
    val petId: UUID,
    val services: List<AppointmentService>,
    val followUpOf: UUID? = null,
    val startAt: Instant,
    val endAt: Instant,
    val status: AppointmentStatus,
    val clientComment: String? = null,
    val vetNotes: String? = null,
    val cancelledBy: UUID? = null,
    val cancelledAt: Instant? = null,
    val cancelReason: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    val estimatedTotal: Double get() = services.filter { it.isPlanned }.totalPrice()

    val actualTotal: Double?
        get() = if (status == AppointmentStatus.COMPLETED) {
            services.filter { it.isPerformed == true }.totalPrice()
        } else null

    val durationMin: Int?
        get() = services.filter { it.isPlanned }.takeIf { planned -> planned.all { it.durationMinSnapshot != null } }
            ?.sumOf { it.durationMinSnapshot!! }

    val bufferAfterMin: Int?
        get() = services.filter { it.isPlanned }.takeIf { planned -> planned.all { it.bufferAfterMinSnapshot != null } }
            ?.maxOfOrNull { it.bufferAfterMinSnapshot!! }

    private fun List<AppointmentService>.totalPrice(): Double =
        fold(BigDecimal.ZERO) { total, service -> total + BigDecimal.valueOf(service.priceSnapshot) }.toDouble()
}
