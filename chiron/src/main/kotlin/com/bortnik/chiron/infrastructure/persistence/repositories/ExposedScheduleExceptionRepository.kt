package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toScheduleException
import com.bortnik.chiron.infrastructure.persistence.models.ExposedScheduleExceptionTable
import com.bortnik.chiron.infrastructure.persistence.toPage
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedScheduleExceptionRepository : ScheduleExceptionRepository {

    override fun create(dto: CreateScheduleExceptionDto): ScheduleException = exposedSql {
        ExposedScheduleExceptionTable.insertReturning {
            it[veterinarianId] = dto.veterinarianId
            it[type] = dto.type
            it[startDate] = dto.startDate
            it[endDate] = dto.endDate
            it[startTime] = dto.startTime
            it[endTime] = dto.endTime
            it[reason] = dto.reason
        }.single().toScheduleException()
    }

    override fun findById(id: UUID): ScheduleException? = exposedSql {
        ExposedScheduleExceptionTable.selectAll()
            .where { ExposedScheduleExceptionTable.id eq id }
            .singleOrNull()
            ?.toScheduleException()
    }

    override fun findAllByVeterinarianId(veterinarianId: UUID): List<ScheduleException> = exposedSql {
        ExposedScheduleExceptionTable.selectAll()
            .where { ExposedScheduleExceptionTable.veterinarianId eq veterinarianId }
            .orderBy(ExposedScheduleExceptionTable.startDate, SortOrder.ASC)
            .map { it.toScheduleException() }
    }

    override fun findAll(filter: ScheduleExceptionFilter): List<ScheduleException> = exposedSql {
        ExposedScheduleExceptionTable.selectAll()
            .where { filter.toCondition() }
            .orderBy(
                ExposedScheduleExceptionTable.startDate to SortOrder.ASC,
                ExposedScheduleExceptionTable.id to SortOrder.ASC,
            )
            .map { it.toScheduleException() }
    }

    override fun findAll(filter: ScheduleExceptionFilter, pageRequest: PageRequest): Page<ScheduleException> =
        exposedSql {
            ExposedScheduleExceptionTable.selectAll()
                .where { filter.toCondition() }
                .toPage(
                    pageRequest,
                    ExposedScheduleExceptionTable.startDate to SortOrder.ASC,
                    ExposedScheduleExceptionTable.id to SortOrder.ASC,
                ) { it.toScheduleException() }
        }

    override fun update(id: UUID, dto: UpdateScheduleExceptionDto): ScheduleException? = exposedSql {
        // Exposed rejects an UPDATE without columns, so an empty patch only reads the row.
        if (dto == UpdateScheduleExceptionDto()) return@exposedSql findById(id)
        ExposedScheduleExceptionTable.updateReturning(where = { ExposedScheduleExceptionTable.id eq id }) {
            dto.type?.let { value -> it[type] = value }
            dto.startDate?.let { value -> it[startDate] = value }
            dto.endDate?.let { value -> it[endDate] = value }
            dto.startTime.ifPresent { value -> it[startTime] = value }
            dto.endTime.ifPresent { value -> it[endTime] = value }
            dto.reason.ifPresent { value -> it[reason] = value }
        }.singleOrNull()?.toScheduleException()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedScheduleExceptionTable.deleteWhere { ExposedScheduleExceptionTable.id eq id } > 0
    }

    private fun ScheduleExceptionFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(veterinarianId?.let { ExposedScheduleExceptionTable.veterinarianId eq it })
        .andIfNotNull(type?.let { ExposedScheduleExceptionTable.type eq it })
        .andIfNotNull(from?.let { ExposedScheduleExceptionTable.endDate greaterEq it })
        .andIfNotNull(to?.let { ExposedScheduleExceptionTable.startDate lessEq it })
}
