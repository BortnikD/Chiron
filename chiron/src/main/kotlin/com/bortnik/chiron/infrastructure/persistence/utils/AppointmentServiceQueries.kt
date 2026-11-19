package com.bortnik.chiron.infrastructure.persistence.utils

import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.infrastructure.persistence.mappers.toAppointmentService
import com.bortnik.chiron.infrastructure.persistence.models.ExposedAppointmentServiceTable
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import java.util.UUID

fun findAppointmentServices(appointmentIds: List<UUID>): Map<UUID, List<AppointmentService>> {
    if (appointmentIds.isEmpty()) return emptyMap()
    return ExposedAppointmentServiceTable.selectAll()
        .where { ExposedAppointmentServiceTable.appointmentId inList appointmentIds }
        .orderBy(
            ExposedAppointmentServiceTable.createdAt to SortOrder.ASC,
            ExposedAppointmentServiceTable.serviceId to SortOrder.ASC,
        )
        .groupBy({ it[ExposedAppointmentServiceTable.appointmentId].value }, { it.toAppointmentService() })
}
