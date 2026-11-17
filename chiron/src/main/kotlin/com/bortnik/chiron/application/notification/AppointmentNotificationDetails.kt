package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import java.time.Instant

data class AppointmentNotificationDetails(
    val petName: String,
    val serviceName: String,
    val veterinarianName: String,
    val startAt: Instant,
    val cancelReason: String? = null,
    val status: AppointmentStatus,
)
