package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetAppointmentUseCase(private val appointmentRepository: AppointmentRepository) {

    fun findById(id: UUID): Appointment = appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

    fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment> {
        AppointmentValidator.validate(filter)
        PageRequestValidator.validate(pageRequest)
        return appointmentRepository.findAll(filter, pageRequest)
    }
}
