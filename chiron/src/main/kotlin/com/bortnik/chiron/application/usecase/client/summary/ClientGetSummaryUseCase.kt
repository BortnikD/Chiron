package com.bortnik.chiron.application.usecase.client.summary

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.GetOwnNotificationsUseCase
import com.bortnik.chiron.domain.dto.client.ClientSummaryDto
import com.bortnik.chiron.domain.repositories.ClientSummaryRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
@Transactional(readOnly = true)
class ClientGetSummaryUseCase(
    private val summaryRepository: ClientSummaryRepository,
    private val getOwnNotificationsUseCase: GetOwnNotificationsUseCase,
    private val clinicProperties: ClinicProperties,
    private val notificationProperties: NotificationProperties,
    private val clock: Clock,
) {
    fun get(actor: Actor): ClientSummaryDto {
        val now = clock.instant()
        val today = now.atZone(clinicProperties.zoneId).toLocalDate()
        val activePets = summaryRepository.countActivePets(actor.userId)
        val appointments = summaryRepository.countAppointments(actor.userId, now)
        val nextAppointment = summaryRepository.findNextAppointment(actor.userId, now)
        val vaccinations = summaryRepository.countVaccinations(
            actor.userId,
            today,
            today.plusDays(notificationProperties.vaccinationDue.leadDays),
        )
        return ClientSummaryDto(
            activePets = activePets,
            upcomingAppointments = appointments.upcoming,
            completedAppointments = appointments.completed,
            vaccinationsDue = vaccinations.due,
            vaccinationsOverdue = vaccinations.overdue,
            unreadNotifications = getOwnNotificationsUseCase.countUnread(actor),
            nextAppointment = nextAppointment,
        )
    }
}
