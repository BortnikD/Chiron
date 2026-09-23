package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.DeletePetUseCase
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeletePetUseCase(private val deletePetUseCase: DeletePetUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun delete(actor: Actor, id: UUID) {
        deletePetUseCase.delete(id)
        log.info("Admin {} ({}) deleted pet {}", actor.userId, actor.fullName, id)
    }
}
