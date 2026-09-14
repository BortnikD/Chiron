package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.mappers.toAppointment
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
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
        ExposedAppointmentTable.updateReturning(where = { ExposedAppointmentTable.id eq id }) {
            it[veterinarianId] = dto.veterinarianId
            it[startAt] = dto.startAt.toDbTimestamp()
            it[endAt] = dto.endAt.toDbTimestamp()
            it[status] = dto.status
            it[clientComment] = dto.clientComment
            it[vetNotes] = dto.vetNotes
            it[cancelledBy] = dto.cancelledBy
            it[cancelledAt] = dto.cancelledAt?.toDbTimestamp()
            it[cancelReason] = dto.cancelReason
            it[updatedAt] = CurrentTimestampWithTimeZone
        }.singleOrNull()?.toAppointment()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedAppointmentTable.deleteWhere { ExposedAppointmentTable.id eq id } > 0
    }
}
