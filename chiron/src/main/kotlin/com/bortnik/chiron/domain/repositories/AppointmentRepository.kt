package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.appointment.AppointmentInterval
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
import java.time.Instant
import java.util.UUID

interface AppointmentRepository {
    fun create(dto: CreateAppointmentDto, services: List<AppointmentService>): Appointment

    fun findById(id: UUID): Appointment?

    fun findByIdForUpdate(id: UUID): Appointment?

    fun replaceServices(id: UUID, services: List<AppointmentService>): Appointment?

    fun findAll(filter: AppointmentFilter): List<Appointment>

    fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment>

    fun findOverlapping(veterinarianId: UUID, from: Instant, to: Instant): List<Appointment>

    fun findOverlappingIntervals(veterinarianId: UUID, from: Instant, to: Instant): List<AppointmentInterval>

    fun findAllByPetId(petId: UUID): List<Appointment>

    fun update(id: UUID, dto: UpdateAppointmentDto): Appointment?

    fun deleteById(id: UUID): Boolean
}
