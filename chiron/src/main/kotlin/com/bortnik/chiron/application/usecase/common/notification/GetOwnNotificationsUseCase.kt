package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.notification.NotificationFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

// Self-service for every role: a user only ever sees their own notifications.
@Service
@Transactional(readOnly = true)
class GetOwnNotificationsUseCase(private val notificationRepository: NotificationRepository) {

    fun findAll(actor: Actor, filter: NotificationFilter, pageRequest: PageRequest): Page<Notification> {
        PageRequestValidator.validate(pageRequest)
        return notificationRepository.findAll(actor.userId, filter, pageRequest)
    }

    fun countUnread(actor: Actor): Long = notificationRepository.countUnread(actor.userId)
}
