package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.UpdatePetUseCase
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ClientUpdatePetUseCase(
    private val updatePetUseCase: UpdatePetUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun update(actor: Actor, id: UUID, dto: UpdatePetDto): Pet {
        accessGuard.requireOwnedPet(actor, id)
        return updatePetUseCase.update(id, dto)
    }
}
