package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@Service
@Transactional
class SendVaccinationDueRemindersUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val createNotificationUseCase: CreateNotificationUseCase,
    private val notificationProperties: NotificationProperties,
    private val clinicProperties: ClinicProperties,
    private val clock: Clock,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun send(): Int {
        val today = LocalDate.now(clock.withZone(clinicProperties.zoneId))
        val candidates = vaccinationRepository.findReminders(
            today, today.plusDays(notificationProperties.vaccinationDue.leadDays),
        )
        val notifications = candidates.map { (vaccination, ownerId, petName) ->
            val dueOn = vaccination.nextDueOn!!
            val overdue = dueOn < today
            val text = if (overdue) NotificationMessages.forVaccinationOverdue(petName, vaccination.name, dueOn)
            else NotificationMessages.forVaccinationDue(petName, vaccination.name, dueOn)
            CreateNotificationDto(
                recipientId = ownerId,
                type = if (overdue) NotificationType.VACCINATION_OVERDUE else NotificationType.VACCINATION_DUE,
                title = text.title,
                body = text.body,
                petId = vaccination.petId,
                vaccinationId = vaccination.id,
                reminderDueOn = dueOn,
            )
        }
        val sent = createNotificationUseCase.createAllIfAbsent(notifications).size
        if (sent > 0) log.info("Sent {} vaccination reminders", sent)
        return sent
    }
}
