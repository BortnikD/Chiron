package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.notification.NotificationFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.mappers.toNotification
import com.bortnik.chiron.infrastructure.persistence.models.ExposedNotificationTable
import com.bortnik.chiron.infrastructure.persistence.toPage
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.statements.UpdateBuilder
import org.jetbrains.exposed.v1.core.statements.MultiRowValuesInsertStatement
import org.jetbrains.exposed.v1.core.statements.ReturningStatement
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.statements.ReturningBlockingExecutable
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedNotificationRepository : NotificationRepository {

    override fun createAll(dtos: List<CreateNotificationDto>): List<Notification> = exposedSql {
        insertAll(dtos, ignoreConflicts = false)
    }

    override fun createAllIfAbsent(dtos: List<CreateNotificationDto>): List<Notification> = exposedSql {
        insertAll(dtos, ignoreConflicts = true)
    }

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
            it.write(dto)
        }.map { it.toNotification() }

    private fun insertAll(dtos: List<CreateNotificationDto>, ignoreConflicts: Boolean): List<Notification> =
        dtos.chunked(1000).flatMap { batch ->
            val insert = MultiRowValuesInsertStatement(ExposedNotificationTable, ignoreConflicts)
            batch.forEach { dto ->
                insert.addBatch()
                insert.write(dto)
            }
            // RETURNING contains only inserted rows, including when some reminders conflict with a concurrent run.
            ReturningBlockingExecutable(
                ReturningStatement(ExposedNotificationTable, ExposedNotificationTable.columns, insert),
            ).map { it.toNotification() }
        }

    private fun UpdateBuilder<*>.write(dto: CreateNotificationDto) {
        this[ExposedNotificationTable.recipientId] = dto.recipientId
        this[ExposedNotificationTable.actorId] = dto.actorId
        this[ExposedNotificationTable.type] = dto.type
        this[ExposedNotificationTable.title] = dto.title
        this[ExposedNotificationTable.body] = dto.body
        this[ExposedNotificationTable.appointmentId] = dto.appointmentId
        this[ExposedNotificationTable.petId] = dto.petId
        this[ExposedNotificationTable.vaccinationId] = dto.vaccinationId
        this[ExposedNotificationTable.reminderStartAt] = dto.reminderStartAt?.toDbTimestamp()
        this[ExposedNotificationTable.reminderDueOn] = dto.reminderDueOn
        this[ExposedNotificationTable.readAt] = null
    }

    private fun unreadOf(recipientId: UUID): Op<Boolean> =
        (ExposedNotificationTable.recipientId eq recipientId) and ExposedNotificationTable.readAt.isNull()
}
