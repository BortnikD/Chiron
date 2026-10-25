package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.notification.NotificationFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Notification
import java.util.UUID

interface NotificationRepository {
    fun create(dto: CreateNotificationDto): Notification

    // null when a unique index already holds such a notification (one reminder per appointment / vaccination).
    fun createIfAbsent(dto: CreateNotificationDto): Notification?

    // Newest first.
    fun findAll(recipientId: UUID, filter: NotificationFilter, pageRequest: PageRequest): Page<Notification>

    fun countUnread(recipientId: UUID): Long

    // null = no such notification of this recipient; an already read one keeps its readAt.
    fun markRead(id: UUID, recipientId: UUID): Notification?

    // Returns the number of notifications that were unread.
    fun markAllRead(recipientId: UUID): Int
}
