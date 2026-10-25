package com.bortnik.chiron.infrastructure.scheduling

import com.bortnik.chiron.application.usecase.common.notification.SendAppointmentRemindersUseCase
import com.bortnik.chiron.application.usecase.common.notification.SendVaccinationDueRemindersUseCase
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

// Only triggers the use cases; both jobs are idempotent (one reminder per appointment / vaccination),
// so a missed or repeated run is harmless.
@Component
class NotificationScheduler(
    private val sendAppointmentRemindersUseCase: SendAppointmentRemindersUseCase,
    private val sendVaccinationDueRemindersUseCase: SendVaccinationDueRemindersUseCase,
) {

    @Scheduled(fixedDelayString = $$"${notification.reminder.check-interval}")
    fun sendAppointmentReminders() {
        sendAppointmentRemindersUseCase.send()
    }

    @Scheduled(cron = $$"${notification.vaccination-due.cron}", zone = $$"${clinic.zone}")
    fun sendVaccinationDueReminders() {
        sendVaccinationDueRemindersUseCase.send()
    }
}
