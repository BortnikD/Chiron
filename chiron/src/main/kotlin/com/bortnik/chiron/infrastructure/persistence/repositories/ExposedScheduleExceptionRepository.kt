package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.scheduleexception.CreateScheduleExceptionDto
import com.bortnik.chiron.domain.dto.scheduleexception.UpdateScheduleExceptionDto
import com.bortnik.chiron.domain.entities.ScheduleException
import com.bortnik.chiron.domain.repositories.ScheduleExceptionRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toScheduleException
import com.bortnik.chiron.infrastructure.persistence.models.ExposedScheduleExceptionTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
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

    override fun update(id: UUID, dto: UpdateScheduleExceptionDto): ScheduleException? = exposedSql {
        ExposedScheduleExceptionTable.updateReturning(where = { ExposedScheduleExceptionTable.id eq id }) {
            it[type] = dto.type
            it[startDate] = dto.startDate
            it[endDate] = dto.endDate
            it[startTime] = dto.startTime
            it[endTime] = dto.endTime
            it[reason] = dto.reason
        }.singleOrNull()?.toScheduleException()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedScheduleExceptionTable.deleteWhere { ExposedScheduleExceptionTable.id eq id } > 0
    }
}
