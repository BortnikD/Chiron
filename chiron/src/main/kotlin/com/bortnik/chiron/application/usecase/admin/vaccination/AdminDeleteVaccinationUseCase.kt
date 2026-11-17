package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.NotifyVaccinationUseCase
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeleteVaccinationUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val notifyVaccination: NotifyVaccinationUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        val vaccination = vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)
        notifyVaccination.notifyDeletion(actor.userId, vaccination)
        if (!vaccinationRepository.deleteById(id)) throw VaccinationNotFoundException(id)
        log.info("Admin {} ({}) deleted vaccination {}", actor.userId, actor.fullName, id)
    }
}
