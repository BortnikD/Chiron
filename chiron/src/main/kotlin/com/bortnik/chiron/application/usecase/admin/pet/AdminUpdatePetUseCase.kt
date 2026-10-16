package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.pet.UpdatePetUseCase
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdatePetUseCase(private val updatePetUseCase: UpdatePetUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdatePetDto): Pet {
        val pet = updatePetUseCase.update(id, dto)
        log.info(
            "Admin {} ({}) updated pet {} '{}', archived {}",
            actor.userId,
            actor.fullName,
            pet.id,
            pet.name,
            pet.isArchived,
        )
        return pet
    }
}
