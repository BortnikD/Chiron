package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.CreatePetUseCase
import com.bortnik.chiron.domain.dto.pet.CreateOwnPetDto
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.entities.Pet
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ClientCreatePetUseCase(private val createPetUseCase: CreatePetUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    // The owner is taken from the actor: a client can only create pets for themselves.
    fun create(actor: Actor, dto: CreateOwnPetDto): Pet {
        val pet = createPetUseCase.create(
            CreatePetDto(
                name = dto.name,
                ownerId = actor.userId,
                speciesId = dto.speciesId,
                birthDate = dto.birthDate,
                weightKg = dto.weightKg,
                gender = dto.gender,
                notes = dto.notes,
            ),
        )
        log.info("Client {} ({}) created pet {} '{}'", actor.userId, actor.fullName, pet.id, pet.name)
        return pet
    }
}
