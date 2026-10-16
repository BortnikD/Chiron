package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import java.util.UUID

interface AppointmentRepository {
    fun create(dto: CreateAppointmentDto): Appointment

    fun findById(id: UUID): Appointment?

    fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment>

    fun findAllByVeterinarianId(veterinarianId: UUID): List<Appointment>

    fun findAllByPetId(petId: UUID): List<Appointment>

    fun update(id: UUID, dto: UpdateAppointmentDto): Appointment?

    fun deleteById(id: UUID): Boolean
}
