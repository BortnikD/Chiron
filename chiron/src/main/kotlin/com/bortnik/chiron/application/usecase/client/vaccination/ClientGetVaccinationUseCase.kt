package com.bortnik.chiron.application.usecase.client.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.dto.vaccination.ClientVaccinationFilter
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetVaccinationUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAll(actor: Actor, filter: ClientVaccinationFilter): List<Vaccination> {
        val scoped = VaccinationFilter(
            petId = filter.petId,
            nextDueFrom = filter.nextDueFrom,
            nextDueTo = filter.nextDueTo,
        )
        VaccinationValidator.validate(scoped)
        filter.petId?.let { accessGuard.requireOwnedPet(actor, it) }
        return vaccinationRepository.findAllByOwnerId(actor.userId, scoped)
    }

    fun findById(actor: Actor, id: UUID): Vaccination = accessGuard.requireOwnedVaccination(actor, id)
}
