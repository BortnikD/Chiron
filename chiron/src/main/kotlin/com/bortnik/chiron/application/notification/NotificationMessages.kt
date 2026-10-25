package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.enums.NotificationType
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

// The texts are in Russian by agreement with the project owner: they are shown to the clinic users as is,
// unlike the rest of the string literals in the code. Times are rendered in the clinic time zone.
object NotificationMessages {

    private val DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy")
    private val TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm")

    fun forAppointment(
        type: NotificationType,
        details: AppointmentNotificationDetails,
        zone: ZoneId,
    ): NotificationText {
        val start = details.startAt.atZone(zone)
        val summary = "${details.petName} — ${details.serviceName}, " +
            "${DATE_FORMAT.format(start)} в ${TIME_FORMAT.format(start)}, врач ${details.veterinarianName}"
        val body = when (type) {
            NotificationType.APPOINTMENT_RESCHEDULED -> "Новое время: $summary."
            NotificationType.APPOINTMENT_CANCELLED ->
                "$summary." + details.cancelReason?.trim()?.trimEnd('.')?.takeIf { it.isNotEmpty() }
                    ?.let { " Причина: $it." }.orEmpty()
            else -> "$summary."
        }
        return NotificationText(title(type), body)
    }

    fun forVaccinationDue(petName: String, vaccinationName: String, dueOn: LocalDate): NotificationText =
        NotificationText(
            title(NotificationType.VACCINATION_DUE),
            "$petName: срок ревакцинации «$vaccinationName» — ${DATE_FORMAT.format(dueOn)}.",
        )

    private fun title(type: NotificationType): String = when (type) {
        NotificationType.APPOINTMENT_BOOKED -> "Новая запись на приём"
        NotificationType.APPOINTMENT_CONFIRMED -> "Запись подтверждена"
        NotificationType.APPOINTMENT_CANCELLED -> "Запись отменена"
        NotificationType.APPOINTMENT_RESCHEDULED -> "Запись перенесена"
        NotificationType.APPOINTMENT_NO_SHOW -> "Отмечена неявка на приём"
        NotificationType.FOLLOW_UP_SCHEDULED -> "Назначен повторный приём"
        NotificationType.APPOINTMENT_REMINDER -> "Напоминание о приёме"
        NotificationType.VACCINATION_DUE -> "Скоро ревакцинация"
    }
}
