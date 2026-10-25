package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.exceptions.notfound.NotificationNotFoundException
import com.bortnik.chiron.domain.repositories.NotificationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

// A notification of another user is reported as not found rather than forbidden, so ids cannot be probed.
@Service
@Transactional
class MarkOwnNotificationsReadUseCase(private val notificationRepository: NotificationRepository) {

    fun markRead(actor: Actor, id: UUID): Notification =
        notificationRepository.markRead(id, actor.userId) ?: throw NotificationNotFoundException(id)

    // Returns how many notifications were unread.
    fun markAllRead(actor: Actor): Int = notificationRepository.markAllRead(actor.userId)
}
