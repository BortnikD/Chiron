package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.notification.NotificationCreatedEvent
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.repositories.NotificationRepository
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

// Stores a notification and hands it to the delivery channels once the surrounding transaction commits.
@Service
@Transactional
class CreateNotificationUseCase(
    private val notificationRepository: NotificationRepository,
    private val eventPublisher: ApplicationEventPublisher,
) {

    fun create(dto: CreateNotificationDto): Notification =
        notificationRepository.create(dto).also(::publish)

    // Used by the scheduler: a notification that already exists is neither stored nor delivered again.
    fun createIfAbsent(dto: CreateNotificationDto): Notification? =
        notificationRepository.createIfAbsent(dto)?.also(::publish)

    private fun publish(notification: Notification) =
        eventPublisher.publishEvent(NotificationCreatedEvent(notification))
}
