package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVaccinationUseCase(private val vaccinationRepository: VaccinationRepository) {

    fun findById(id: UUID): Vaccination = vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)

    fun findAllByPetId(petId: UUID): List<Vaccination> = vaccinationRepository.findAllByPetId(petId)
}
