package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVaccinationUseCase(private val vaccinationRepository: VaccinationRepository) {

    fun findById(id: UUID): Vaccination = vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)

    fun findAllByPetId(petId: UUID): List<Vaccination> = vaccinationRepository.findAllByPetId(petId)

    fun findAll(filter: VaccinationFilter, pageRequest: PageRequest): Page<Vaccination> {
        VaccinationValidator.validate(filter)
        PageRequestValidator.validate(pageRequest)
        return vaccinationRepository.findAll(filter, pageRequest)
    }
}
