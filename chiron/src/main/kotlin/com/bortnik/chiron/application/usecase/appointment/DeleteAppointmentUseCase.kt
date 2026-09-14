package com.bortnik.chiron.application.usecase.appointment

import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteAppointmentUseCase(private val appointmentRepository: AppointmentRepository) {

    fun delete(id: UUID) {
        if (!appointmentRepository.deleteById(id)) throw AppointmentNotFoundException(id)
    }
}
