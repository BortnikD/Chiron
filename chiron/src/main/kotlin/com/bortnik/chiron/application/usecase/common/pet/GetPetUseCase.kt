package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PageRequestValidator
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetPetUseCase(private val petRepository: PetRepository) {

    fun findById(id: UUID): Pet = petRepository.findById(id) ?: throw PetNotFoundException(id)

    fun findAll(filter: PetFilter): List<Pet> {
        PetValidator.validate(filter)
        return petRepository.findAll(filter)
    }

    fun findAll(filter: PetFilter, pageRequest: PageRequest): Page<Pet> {
        PetValidator.validate(filter)
        PageRequestValidator.validate(pageRequest)
        return petRepository.findAll(filter, pageRequest)
    }
}
