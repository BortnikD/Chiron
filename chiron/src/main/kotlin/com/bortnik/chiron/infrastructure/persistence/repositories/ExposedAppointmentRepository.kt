package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.toPage
import com.bortnik.chiron.infrastructure.persistence.mappers.toAppointment
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Repository
@Transactional
class ExposedAppointmentRepository : AppointmentRepository {

    override fun create(dto: CreateAppointmentDto): Appointment = exposedSql {
        ExposedAppointmentTable.insertReturning {
            it[veterinarianId] = dto.veterinarianId
            it[petId] = dto.petId
            it[serviceId] = dto.serviceId
            it[followUpOf] = dto.followUpOf
            it[startAt] = dto.startAt.toDbTimestamp()
            it[endAt] = dto.endAt.toDbTimestamp()
            it[status] = dto.status
            it[priceSnapshot] = dto.priceSnapshot.toDbDecimal()
            it[clientComment] = dto.clientComment
        }.single().toAppointment()
    }

    override fun findById(id: UUID): Appointment? = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.id eq id }
            .singleOrNull()
            ?.toAppointment()
    }

    override fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment> = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { filter.toCondition() }
            .toPage(
                pageRequest,
                ExposedAppointmentTable.startAt to SortOrder.ASC,
                ExposedAppointmentTable.id to SortOrder.ASC,
            ) { it.toAppointment() }
    }

    override fun findAllByVeterinarianId(veterinarianId: UUID): List<Appointment> = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.veterinarianId eq veterinarianId }
            .orderBy(ExposedAppointmentTable.startAt, SortOrder.ASC)
            .map { it.toAppointment() }
    }

    override fun findAllByPetId(petId: UUID): List<Appointment> = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.petId eq petId }
            .orderBy(ExposedAppointmentTable.startAt, SortOrder.DESC)
            .map { it.toAppointment() }
    }

    override fun update(id: UUID, dto: UpdateAppointmentDto): Appointment? = exposedSql {
        // An empty patch has nothing to write, so updatedAt is left untouched.
        if (dto == UpdateAppointmentDto()) return@exposedSql findById(id)
        ExposedAppointmentTable.updateReturning(where = { ExposedAppointmentTable.id eq id }) {
            dto.veterinarianId?.let { value -> it[veterinarianId] = value }
            dto.startAt?.let { value -> it[startAt] = value.toDbTimestamp() }
            dto.endAt?.let { value -> it[endAt] = value.toDbTimestamp() }
            dto.status?.let { value -> it[status] = value }
            dto.clientComment.ifPresent { value -> it[clientComment] = value }
            dto.vetNotes.ifPresent { value -> it[vetNotes] = value }
            dto.cancelledBy.ifPresent { value -> it[cancelledBy] = value }
            dto.cancelledAt.ifPresent { value -> it[cancelledAt] = value?.toDbTimestamp() }
            dto.cancelReason.ifPresent { value -> it[cancelReason] = value }
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toAppointment()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedAppointmentTable.deleteWhere { ExposedAppointmentTable.id eq id } > 0
    }

    private fun AppointmentFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(veterinarianId?.let { ExposedAppointmentTable.veterinarianId eq it })
        .andIfNotNull(petId?.let { ExposedAppointmentTable.petId eq it })
        .andIfNotNull(serviceId?.let { ExposedAppointmentTable.serviceId eq it })
        .andIfNotNull(
            ownerId?.let {
                ExposedAppointmentTable.petId inSubQuery
                    ExposedPetTable.select(ExposedPetTable.id).where { ExposedPetTable.ownerId eq it }
            },
        )
        .andIfNotNull(statuses?.let { ExposedAppointmentTable.status inList it })
        .andIfNotNull(from?.let { ExposedAppointmentTable.startAt greaterEq it.toDbTimestamp() })
        .andIfNotNull(to?.let { ExposedAppointmentTable.startAt less it.toDbTimestamp() })
}
