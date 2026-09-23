package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.UpdatePetUseCase
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdatePetUseCase(private val updatePetUseCase: UpdatePetUseCase) {

    fun update(actor: Actor, id: UUID, dto: UpdatePetDto): Pet = updatePetUseCase.update(id, dto)
}
