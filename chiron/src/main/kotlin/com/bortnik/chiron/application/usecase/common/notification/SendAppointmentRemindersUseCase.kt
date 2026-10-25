package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional
class SendAppointmentRemindersUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val notifyAppointmentUseCase: NotifyAppointmentUseCase,
    private val notificationProperties: NotificationProperties,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    // Every pending or confirmed appointment that starts within the lead time is reminded of once, so a run only
    // adds reminders for the appointments that entered the window since the previous one. Returns how many were sent.
    fun send(): Int {
        val now = Instant.now()
        val appointments = appointmentRepository.findAll(
            AppointmentFilter(
                statuses = setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                from = now,
                to = now + notificationProperties.reminder.leadTime,
            ),
        )
        val sent = appointments.count { notifyAppointmentUseCase.remind(it) }
        if (sent > 0) log.info("Sent {} appointment reminders", sent)
        return sent
    }
}
