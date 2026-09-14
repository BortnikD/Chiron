package com.bortnik.chiron.application.usecase.pet

import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeletePetUseCase(private val petRepository: PetRepository) {

    fun delete(id: UUID) {
        if (!petRepository.deleteById(id)) throw PetNotFoundException(id)
    }
}
