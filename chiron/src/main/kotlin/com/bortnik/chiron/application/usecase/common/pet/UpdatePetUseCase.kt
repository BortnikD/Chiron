package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdatePetUseCase(private val petRepository: PetRepository) {

    fun update(id: UUID, dto: UpdatePetDto): Pet {
        PetValidator.validate(dto)
        return petRepository.update(id, dto) ?: throw PetNotFoundException(id)
    }
}
