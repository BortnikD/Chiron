package com.bortnik.chiron.application.usecase.vaccination

import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteVaccinationUseCase(private val vaccinationRepository: VaccinationRepository) {

    fun delete(id: UUID) {
        if (!vaccinationRepository.deleteById(id)) throw VaccinationNotFoundException(id)
    }
}
