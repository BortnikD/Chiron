package com.bortnik.chiron.application.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

// Only the values the use cases need; the schedules (notification.reminder.check-interval,
// notification.vaccination-due.cron) are read by @Scheduled in infrastructure/scheduling/NotificationScheduler.
@ConfigurationProperties(prefix = "notification")
data class NotificationProperties(
    val reminder: Reminder,
    val vaccinationDue: VaccinationDue,
) {
    // Appointments starting within leadTime from now get a reminder.
    data class Reminder(
        val leadTime: Duration,
    )

    // Vaccinations whose next due date is within leadDays from today get a reminder.
    data class VaccinationDue(
        val leadDays: Long,
    )
}
