package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.entities.Appointment
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetAppointmentUseCase(private val getAppointmentUseCase: GetAppointmentUseCase) {

    fun findById(id: UUID): Appointment = getAppointmentUseCase.findById(id)

    fun findAll(filter: AppointmentFilter, pageRequest: PageRequest): Page<Appointment> =
        getAppointmentUseCase.findAll(filter, pageRequest)
}
