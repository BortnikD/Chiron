package com.bortnik.chiron.application.notification

import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.Vaccination
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
            NotificationType.APPOINTMENT_COMPLETED -> "$summary. Результаты приёма доступны в записи."
            NotificationType.APPOINTMENT_NOTES_UPDATED -> "$summary. Заметки к приёму изменены."
            NotificationType.FOLLOW_UP_SCHEDULED -> "$summary. Статус записи: " + when (details.status) {
                AppointmentStatus.PENDING -> "ожидает подтверждения."
                AppointmentStatus.CONFIRMED -> "подтверждена."
                AppointmentStatus.CANCELLED -> "отменена."
                AppointmentStatus.COMPLETED -> "приём завершён."
                AppointmentStatus.NO_SHOW -> "неявка."
            }

            NotificationType.SCHEDULE_CONFLICT ->
                "$summary. Приём конфликтует с доступностью врача. Необходимо согласовать с клиентом отмену или перенос."

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

    fun forVaccinationOverdue(petName: String, vaccinationName: String, dueOn: LocalDate): NotificationText =
        NotificationText(
            title(NotificationType.VACCINATION_OVERDUE),
            "$petName: срок ревакцинации «$vaccinationName» истёк ${DATE_FORMAT.format(dueOn)}. Свяжитесь с клиникой.",
        )

    fun forVaccinationChange(type: NotificationType, petName: String, vaccination: Vaccination): NotificationText =
        NotificationText(
            title(type),
            "$petName: прививка «${vaccination.name}», дата введения — ${DATE_FORMAT.format(vaccination.administeredOn)}." +
                    (vaccination.nextDueOn?.let { " Срок ревакцинации — ${DATE_FORMAT.format(it)}." }
                        ?: " Срок ревакцинации не указан."),
        )

    fun forAccountUpdate(before: User, after: User): NotificationText? {
        val fields = listOfNotNull(
            "ФИО".takeIf { before.firstName != after.firstName || before.middleName != after.middleName || before.lastName != after.lastName },
            "электронная почта".takeIf { before.email != after.email },
            "телефон".takeIf { before.phone != after.phone },
        )
        return if (fields.isEmpty()) null else NotificationText(
            title(NotificationType.ACCOUNT_UPDATED),
            "Изменены данные вашего аккаунта: ${fields.joinToString(", ")}. Если это были не вы, свяжитесь с клиникой.",
        )
    }

    fun forPasswordChange(): NotificationText = NotificationText(
        title(NotificationType.PASSWORD_CHANGED),
        "Пароль вашего аккаунта изменён. Если это были не вы, свяжитесь с клиникой.",
    )

    fun forPetChange(type: NotificationType, petName: String): NotificationText = NotificationText(
        title(type),
        when (type) {
            NotificationType.PET_ARCHIVED -> "$petName: карточка питомца перемещена в архив."
            NotificationType.PET_RESTORED -> "$petName: карточка питомца восстановлена из архива."
            else -> "$petName: данные карточки питомца изменены администратором."
        },
    )

    private fun title(type: NotificationType): String = when (type) {
        NotificationType.APPOINTMENT_BOOKED -> "Новая запись на приём"
        NotificationType.APPOINTMENT_CONFIRMED -> "Запись подтверждена"
        NotificationType.APPOINTMENT_CANCELLED -> "Запись отменена"
        NotificationType.APPOINTMENT_RESCHEDULED -> "Запись перенесена"
        NotificationType.APPOINTMENT_NO_SHOW -> "Отмечена неявка на приём"
        NotificationType.APPOINTMENT_COMPLETED -> "Приём завершён"
        NotificationType.APPOINTMENT_NOTES_UPDATED -> "Заметки к приёму обновлены"
        NotificationType.SCHEDULE_CONFLICT -> "Требуется решение по записи на приём"
        NotificationType.FOLLOW_UP_SCHEDULED -> "Назначен повторный приём"
        NotificationType.APPOINTMENT_REMINDER -> "Напоминание о приёме"
        NotificationType.VACCINATION_DUE -> "Скоро ревакцинация"
        NotificationType.VACCINATION_OVERDUE -> "Ревакцинация просрочена"
        NotificationType.VACCINATION_CREATED -> "Добавлена прививка"
        NotificationType.VACCINATION_UPDATED -> "Данные прививки обновлены"
        NotificationType.VACCINATION_DELETED -> "Запись о прививке удалена"
        NotificationType.ACCOUNT_UPDATED -> "Данные аккаунта изменены"
        NotificationType.PASSWORD_CHANGED -> "Пароль изменён"
        NotificationType.PET_UPDATED -> "Данные питомца обновлены"
        NotificationType.PET_ARCHIVED -> "Питомец перенесён в архив"
        NotificationType.PET_RESTORED -> "Питомец восстановлен из архива"
        NotificationType.ADMIN_MESSAGE -> error("Admin messages use custom titles")
    }
}
