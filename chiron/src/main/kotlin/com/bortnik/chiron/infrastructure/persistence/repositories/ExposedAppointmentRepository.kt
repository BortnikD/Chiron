package com.bortnik.chiron.infrastructure.persistence.repositories

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AppointmentInterval
import com.bortnik.chiron.domain.dto.appointment.AppointmentSortDirection
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.ifPresent
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.infrastructure.persistence.exposedSql
import com.bortnik.chiron.infrastructure.persistence.toPage
import com.bortnik.chiron.infrastructure.persistence.mappers.toAppointment
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbDecimal
import com.bortnik.chiron.infrastructure.persistence.mappers.toDbTimestamp
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentServiceTable
import com.bortnik.chiron.infrastructure.persistence.models.ExposedPetTable
import com.bortnik.chiron.infrastructure.persistence.utils.findAppointmentServices
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.andIfNotNull
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greater
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.inSubQuery
import org.jetbrains.exposed.v1.core.less
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.core.notInList
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.batchUpsert
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.jetbrains.exposed.v1.jdbc.update
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Repository
@Transactional
class ExposedAppointmentRepository : AppointmentRepository {

    override fun create(dto: CreateAppointmentDto, services: List<AppointmentService>): Appointment = exposedSql {
        val row = ExposedAppointmentTable.insertReturning {
            it[veterinarianId] = dto.veterinarianId
            it[petId] = dto.petId
            it[followUpOf] = dto.followUpOf
            it[startAt] = dto.startAt.toDbTimestamp()
            it[endAt] = dto.endAt.toDbTimestamp()
            it[status] = dto.status
            it[clientComment] = dto.clientComment
        }.single()
        writeServices(row[ExposedAppointmentTable.id].value, services)
        row.toAppointment(services)
    }

    override fun findById(id: UUID): Appointment? = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.id eq id }
            .toList().toAppointments().singleOrNull()
    }

    override fun findByIdForUpdate(id: UUID): Appointment? = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.id eq id }
            .forUpdate()
            .toList().toAppointments().singleOrNull()
    }

    override fun replaceServices(id: UUID, services: List<AppointmentService>): Appointment? = exposedSql {
        if (ExposedAppointmentTable.update({ ExposedAppointmentTable.id eq id }) {
                it[updatedAt] = CurrentTimestampWithTimeZone
            } == 0
        ) return@exposedSql null
        ExposedAppointmentServiceTable.deleteWhere {
            (appointmentId eq id) and (serviceId notInList services.map { it.serviceId })
        }
        writeServices(id, services)
        findById(id)
    }

    override fun findAll(filter: AppointmentFilter): List<Appointment> = exposedSql {
        val sortOrder = if (filter.direction == AppointmentSortDirection.DESC) SortOrder.DESC else SortOrder.ASC
        ExposedAppointmentTable.selectAll()
            .where { filter.toCondition() }
            .orderBy(ExposedAppointmentTable.startAt to sortOrder, ExposedAppointmentTable.id to sortOrder)
            .toList().toAppointments()
    }

    override fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment> = exposedSql {
        val sortOrder = if (filter.direction == AppointmentSortDirection.DESC) SortOrder.DESC else SortOrder.ASC
        val page = ExposedAppointmentTable.selectAll()
            .where { filter.toCondition() }
            .toPage(
                pageRequest,
                ExposedAppointmentTable.startAt to sortOrder,
                ExposedAppointmentTable.id to sortOrder,
            ) { it }
        Page(page.items.toAppointments(), page.page, page.size, page.totalElements)
    }

    override fun findOverlapping(veterinarianId: UUID, from: Instant, to: Instant): List<Appointment> = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where {
                (ExposedAppointmentTable.veterinarianId eq veterinarianId) and
                        (ExposedAppointmentTable.status neq AppointmentStatus.CANCELLED) and
                        (ExposedAppointmentTable.startAt less to.toDbTimestamp()) and
                        (ExposedAppointmentTable.endAt greater from.toDbTimestamp())
            }
            .orderBy(ExposedAppointmentTable.startAt, SortOrder.ASC)
            .toList().toAppointments()
    }

    override fun findOverlappingIntervals(
        veterinarianId: UUID,
        from: Instant,
        to: Instant,
    ): List<AppointmentInterval> = exposedSql {
        ExposedAppointmentTable.select(
            ExposedAppointmentTable.id,
            ExposedAppointmentTable.startAt,
            ExposedAppointmentTable.endAt,
            ExposedAppointmentTable.status,
        ).where {
            (ExposedAppointmentTable.veterinarianId eq veterinarianId) and
                    (ExposedAppointmentTable.status neq AppointmentStatus.CANCELLED) and
                    (ExposedAppointmentTable.startAt less to.toDbTimestamp()) and
                    (ExposedAppointmentTable.endAt greater from.toDbTimestamp())
        }.orderBy(ExposedAppointmentTable.startAt, SortOrder.ASC).map {
            AppointmentInterval(
                id = it[ExposedAppointmentTable.id].value,
                startAt = it[ExposedAppointmentTable.startAt].toInstant(),
                endAt = it[ExposedAppointmentTable.endAt].toInstant(),
                status = it[ExposedAppointmentTable.status],
            )
        }
    }

    override fun findAllByPetId(petId: UUID): List<Appointment> = exposedSql {
        ExposedAppointmentTable.selectAll()
            .where { ExposedAppointmentTable.petId eq petId }
            .orderBy(ExposedAppointmentTable.startAt, SortOrder.DESC)
            .toList().toAppointments()
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
        }.toList().toAppointments().singleOrNull()
    }

    override fun deleteById(id: UUID): Boolean = exposedSql {
        ExposedAppointmentTable.deleteWhere { ExposedAppointmentTable.id eq id } > 0
    }

    private fun AppointmentFilter.toCondition(): Op<Boolean> = Op.TRUE
        .andIfNotNull(veterinarianId?.let { ExposedAppointmentTable.veterinarianId eq it })
        .andIfNotNull(petId?.let { ExposedAppointmentTable.petId eq it })
        .andIfNotNull(serviceId?.let { selected ->
            ExposedAppointmentTable.id inSubQuery ExposedAppointmentServiceTable
                .select(ExposedAppointmentServiceTable.appointmentId)
                .where {
                    (ExposedAppointmentServiceTable.serviceId eq selected) and
                            ((ExposedAppointmentServiceTable.isPlanned eq true) or
                                    (ExposedAppointmentServiceTable.isPerformed eq true))
                }
        })
        .andIfNotNull(
            ownerId?.let {
                ExposedAppointmentTable.petId inSubQuery
                        ExposedPetTable.select(ExposedPetTable.id).where { ExposedPetTable.ownerId eq it }
            },
        )
        .andIfNotNull(statuses?.let { ExposedAppointmentTable.status inList it })
        .andIfNotNull(from?.let { ExposedAppointmentTable.startAt greaterEq it.toDbTimestamp() })
        .andIfNotNull(to?.let { ExposedAppointmentTable.startAt less it.toDbTimestamp() })

    private fun List<ResultRow>.toAppointments(): List<Appointment> {
        val services = findAppointmentServices(map { it[ExposedAppointmentTable.id].value })
        return map { it.toAppointment(services[it[ExposedAppointmentTable.id].value].orEmpty()) }
    }

    private fun writeServices(id: UUID, services: List<AppointmentService>) {
        ExposedAppointmentServiceTable.batchUpsert(services, shouldReturnGeneratedValues = false) { service ->
            this[ExposedAppointmentServiceTable.appointmentId] = id
            this[ExposedAppointmentServiceTable.serviceId] = service.serviceId
            this[ExposedAppointmentServiceTable.nameSnapshot] = service.nameSnapshot
            this[ExposedAppointmentServiceTable.priceSnapshot] = service.priceSnapshot.toDbDecimal()
            this[ExposedAppointmentServiceTable.durationMinSnapshot] = service.durationMinSnapshot
            this[ExposedAppointmentServiceTable.bufferAfterMinSnapshot] = service.bufferAfterMinSnapshot
            this[ExposedAppointmentServiceTable.isPlanned] = service.isPlanned
            this[ExposedAppointmentServiceTable.isPerformed] = service.isPerformed
            this[ExposedAppointmentServiceTable.addedBy] = service.addedBy
            this[ExposedAppointmentServiceTable.createdAt] = service.createdAt.toDbTimestamp()
            this[ExposedAppointmentServiceTable.updatedBy] = service.updatedBy
            this[ExposedAppointmentServiceTable.updatedAt] = service.updatedAt.toDbTimestamp()
        }
    }
}
