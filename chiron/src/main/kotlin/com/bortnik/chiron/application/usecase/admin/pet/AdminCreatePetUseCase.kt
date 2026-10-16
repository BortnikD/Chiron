package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.CreatePetUseCase
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.entities.Pet
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreatePetUseCase(private val createPetUseCase: CreatePetUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreatePetDto): Pet {
        val pet = createPetUseCase.create(dto)
        log.info(
            "Admin {} ({}) created pet {} '{}' for owner {}",
            actor.userId,
            actor.fullName,
            pet.id,
            pet.name,
            pet.ownerId,
        )
        return pet
    }
}
