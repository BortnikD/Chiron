package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentDeletionNotAllowedException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteAppointmentUseCase(private val appointmentRepository: AppointmentRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        val appointment = appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)
        if (appointment.status != AppointmentStatus.CANCELLED) {
            throw AppointmentDeletionNotAllowedException(id, appointment.status)
        }
        if (!appointmentRepository.deleteById(id)) throw AppointmentNotFoundException(id)
        log.info("Admin {} ({}) deleted appointment {}", actor.userId, actor.fullName, id)
    }
}
