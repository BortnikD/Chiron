package com.bortnik.chiron.infrastructure.persistence.models

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.date

object ExposedVaccinationTable : UUIDTable("vaccination") {
    val petId = reference("pet_id", ExposedPetTable)
    val appointmentId = optReference("appointment_id", ExposedAppointmentTable)
    val name = text("name")
    val administeredOn = date("administered_on")
    val nextDueOn = date("next_due_on").nullable()
}
