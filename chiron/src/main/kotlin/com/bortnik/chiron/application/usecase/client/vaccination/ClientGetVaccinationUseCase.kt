package com.bortnik.chiron.application.usecase.client.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetVaccinationUseCase(
    private val getVaccinationUseCase: GetVaccinationUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAllByPetId(actor: Actor, petId: UUID): List<Vaccination> {
        accessGuard.requireOwnedPet(actor, petId)
        return getVaccinationUseCase.findAllByPetId(petId)
    }

    fun findById(actor: Actor, id: UUID): Vaccination = accessGuard.requireOwnedVaccination(actor, id)
}
