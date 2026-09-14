package com.bortnik.chiron.domain.utils

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus

object AppointmentStatusRules {
    private val allowedTransitions: Map<AppointmentStatus, Set<AppointmentStatus>> = mapOf(
        AppointmentStatus.PENDING to setOf(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED),
        AppointmentStatus.CONFIRMED to setOf(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW),
        AppointmentStatus.COMPLETED to emptySet(),
        AppointmentStatus.CANCELLED to emptySet(),
        AppointmentStatus.NO_SHOW to emptySet(),
    )

    fun canTransition(from: AppointmentStatus, to: AppointmentStatus): Boolean =
        from == to || to in allowedTransitions.getValue(from)

    fun isTerminal(status: AppointmentStatus): Boolean = allowedTransitions.getValue(status).isEmpty()
}
