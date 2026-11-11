package com.bortnik.chiron.application.usecase.veterinarian.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class VeterinarianGetPatientUseCase(
    private val accessGuard: ResourceAccessGuard,
    private val getPetUseCase: GetPetUseCase,
) {

    fun findAll(actor: Actor, filter: PetFilter, pageRequest: PageRequest): Page<Pet> =
        getPetUseCase.findAll(
            filter.copy(patientOfVeterinarianId = accessGuard.requireVeterinarian(actor).id),
            pageRequest,
        )

    fun findById(actor: Actor, petId: UUID): Pet = accessGuard.requirePatient(actor, petId)
}
