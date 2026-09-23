package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetPetUseCase(private val petRepository: PetRepository) {

    fun findById(id: UUID): Pet = petRepository.findById(id) ?: throw PetNotFoundException(id)

    fun findAllByOwnerId(ownerId: UUID): List<Pet> = petRepository.findAllByOwnerId(ownerId)

    fun findAll(): List<Pet> = petRepository.findAll()
}
