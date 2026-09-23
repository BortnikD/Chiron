package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateVaccinationUseCase(private val vaccinationRepository: VaccinationRepository) {

    fun update(id: UUID, dto: UpdateVaccinationDto): Vaccination {
        VaccinationValidator.validate(dto)
        return vaccinationRepository.update(id, dto) ?: throw VaccinationNotFoundException(id)
    }
}
