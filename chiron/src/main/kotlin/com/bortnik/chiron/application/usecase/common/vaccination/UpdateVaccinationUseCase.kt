package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.application.usecase.common.notification.NotifyVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class UpdateVaccinationUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val clock: Clock,
    private val notifyVaccination: NotifyVaccinationUseCase,
) {

    fun update(id: UUID, dto: UpdateVaccinationDto, actorId: UUID): Vaccination {
        val existing = vaccinationRepository.findById(id) ?: throw VaccinationNotFoundException(id)
        VaccinationValidator.validate(existing, dto, LocalDate.now(clock))
        val updated = vaccinationRepository.update(id, dto) ?: throw VaccinationNotFoundException(id)
        notifyVaccination.notifyChange(actorId, existing, updated)
        return updated
    }
}
