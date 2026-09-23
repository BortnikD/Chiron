package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetPetUseCase(
    private val getPetUseCase: GetPetUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAll(actor: Actor): List<Pet> = getPetUseCase.findAllByOwnerId(actor.userId)

    fun findById(actor: Actor, id: UUID): Pet = accessGuard.requireOwnedPet(actor, id)
}
