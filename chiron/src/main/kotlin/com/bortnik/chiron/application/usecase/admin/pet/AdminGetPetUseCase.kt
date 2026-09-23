package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetPetUseCase(private val getPetUseCase: GetPetUseCase) {

    fun findById(actor: Actor, id: UUID): Pet = getPetUseCase.findById(id)

    fun findAllByOwnerId(actor: Actor, ownerId: UUID): List<Pet> = getPetUseCase.findAllByOwnerId(ownerId)

    fun findAll(actor: Actor): List<Pet> = getPetUseCase.findAll()
}
