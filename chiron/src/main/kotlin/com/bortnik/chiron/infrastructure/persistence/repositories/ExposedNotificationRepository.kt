package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.notification.NotificationFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toNotification
import com.bortnik.chiron.infrastructure.persistence.models.ExposedNotificationTable
import com.bortnik.chiron.infrastructure.persistence.toPage
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedNotificationRepository : NotificationRepository {

    override fun create(dto: CreateNotificationDto): Notification = exposedSql {
        insert(dto, ignoreConflicts = false).single()
    }

    // ON CONFLICT DO NOTHING returns no row when the unique index already holds the notification.
    override fun createIfAbsent(dto: CreateNotificationDto): Notification? = exposedSql {
        insert(dto, ignoreConflicts = true).singleOrNull()
    }

    override fun findAll(
        recipientId: UUID,
        filter: NotificationFilter,
        pageRequest: PageRequest,
    ): Page<Notification> = exposedSql {
        ExposedNotificationTable.selectAll()
            .where {
                if (filter.unreadOnly) unreadOf(recipientId) else ExposedNotificationTable.recipientId eq recipientId
            }
            .toPage(
                pageRequest,
                ExposedNotificationTable.createdAt to SortOrder.DESC,
                ExposedNotificationTable.id to SortOrder.DESC,
            ) { it.toNotification() }
    }

    override fun countUnread(recipientId: UUID): Long = exposedSql {
        ExposedNotificationTable.selectAll()
            .where { unreadOf(recipientId) }
            .count()
    }

    override fun markRead(id: UUID, recipientId: UUID): Notification? = exposedSql {
        ExposedNotificationTable.updateReturning(
            where = { (ExposedNotificationTable.id eq id) and unreadOf(recipientId) },
        ) {
            it[readAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toNotification()
            ?: ExposedNotificationTable.selectAll()
                .where { (ExposedNotificationTable.id eq id) and (ExposedNotificationTable.recipientId eq recipientId) }
                .singleOrNull()
                ?.toNotification()
    }

    override fun markAllRead(recipientId: UUID): Int = exposedSql {
        ExposedNotificationTable.update(where = { unreadOf(recipientId) }) {
            it[readAt] = CurrentTimestampWithTimeZone
        }
    }

    private fun insert(dto: CreateNotificationDto, ignoreConflicts: Boolean): List<Notification> =
        ExposedNotificationTable.insertReturning(ignoreErrors = ignoreConflicts) {
            it[recipientId] = dto.recipientId
            it[actorId] = dto.actorId
            it[type] = dto.type
            it[title] = dto.title
            it[body] = dto.body
            it[appointmentId] = dto.appointmentId
            it[petId] = dto.petId
            it[vaccinationId] = dto.vaccinationId
        }.map { it.toNotification() }

    private fun unreadOf(recipientId: UUID): Op<Boolean> =
        (ExposedNotificationTable.recipientId eq recipientId) and ExposedNotificationTable.readAt.isNull()
}
