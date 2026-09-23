package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.workschedule.CreateWorkScheduleDto
import com.bortnik.chiron.domain.dto.workschedule.UpdateWorkScheduleDto
import com.bortnik.chiron.domain.entities.WorkSchedule
import com.bortnik.chiron.domain.repositories.WorkScheduleRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toWorkSchedule
import com.bortnik.chiron.infrastructure.persistence.models.ExposedWorkScheduleTable
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
class ExposedWorkScheduleRepository : WorkScheduleRepository {

    override fun create(dto: CreateWorkScheduleDto): WorkSchedule = exposedSql {
        ExposedWorkScheduleTable.insertReturning {
            it[veterinarianId] = dto.veterinarianId
            it[dayOfWeek] = dto.dayOfWeek.value
            it[startTime] = dto.startTime
            it[endTime] = dto.endTime
            it[breakStart] = dto.breakStart
            it[breakEnd] = dto.breakEnd
        }.single().toWorkSchedule()
    }

    override fun findById(id: UUID): WorkSchedule? = exposedSql {
        ExposedWorkScheduleTable.selectAll()
            .where { ExposedWorkScheduleTable.id eq id }
            .singleOrNull()
            ?.toWorkSchedule()
    }

    override fun findAllByVeterinarianId(veterinarianId: UUID): List<WorkSchedule> = exposedSql {
        ExposedWorkScheduleTable.selectAll()
            .where { ExposedWorkScheduleTable.veterinarianId eq veterinarianId }
            .orderBy(ExposedWorkScheduleTable.dayOfWeek, SortOrder.ASC)
            .map { it.toWorkSchedule() }
    }

    override fun update(id: UUID, dto: UpdateWorkScheduleDto): WorkSchedule? = exposedSql {
        // Exposed rejects an UPDATE without columns, so an empty patch only reads the row.
        if (dto == UpdateWorkScheduleDto()) return@exposedSql findById(id)
        ExposedWorkScheduleTable.updateReturning(where = { ExposedWorkScheduleTable.id eq id }) {
            dto.startTime?.let { value -> it[startTime] = value }
            dto.endTime?.let { value -> it[endTime] = value }
            dto.breakStart.ifPresent { value -> it[breakStart] = value }
            dto.breakEnd.ifPresent { value -> it[breakEnd] = value }
        }.singleOrNull()?.toWorkSchedule()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedWorkScheduleTable.deleteWhere { ExposedWorkScheduleTable.id eq id } > 0
    }
}
