package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.DeletePetUseCase
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminDeletePetUseCase(private val deletePetUseCase: DeletePetUseCase) {

    fun delete(actor: Actor, id: UUID) = deletePetUseCase.delete(id)
}
