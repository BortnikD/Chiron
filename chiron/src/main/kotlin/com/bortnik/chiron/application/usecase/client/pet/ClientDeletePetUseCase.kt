package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.DeletePetUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class ClientDeletePetUseCase(
    private val deletePetUseCase: DeletePetUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        accessGuard.requireOwnedPet(actor, id)
        deletePetUseCase.delete(id)
        log.info("Client {} ({}) deleted pet {}", actor.userId, actor.fullName, id)
    }
}
