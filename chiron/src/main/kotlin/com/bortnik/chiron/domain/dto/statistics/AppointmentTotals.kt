package com.bortnik.chiron.domain.dto.statistics

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

// Appointment counts and price sums of one group, by status; a missing status counts as zero.
// Rates are null when there is nothing to divide by.
data class AppointmentTotals(
    val countByStatus: Map<AppointmentStatus, Long> = emptyMap(),
    val priceByStatus: Map<AppointmentStatus, Double> = emptyMap(),
) {
    val total: Long get() = countByStatus.values.sum()

    // Only completed appointments are paid; pending and confirmed ones are still expected to be.
    val revenue: Double get() = price(AppointmentStatus.COMPLETED)

    val expectedRevenue: Double get() = price(AppointmentStatus.PENDING) + price(AppointmentStatus.CONFIRMED)

    val averageCheck: Double?
        get() = count(AppointmentStatus.COMPLETED).takeIf { it > 0 }?.let { revenue / it }

    val cancellationRate: Double? get() = ratio(count(AppointmentStatus.CANCELLED), total)

    // Measured against the appointments whose outcome is known: either completed or missed.
    val noShowRate: Double?
        get() = ratio(
            count(AppointmentStatus.NO_SHOW),
            count(AppointmentStatus.COMPLETED) + count(AppointmentStatus.NO_SHOW),
        )

    fun count(status: AppointmentStatus): Long = countByStatus[status] ?: 0

    private fun price(status: AppointmentStatus): Double = priceByStatus[status] ?: 0.0

    private fun ratio(part: Long, whole: Long): Double? = whole.takeIf { it > 0 }?.let { part.toDouble() / it }
}
