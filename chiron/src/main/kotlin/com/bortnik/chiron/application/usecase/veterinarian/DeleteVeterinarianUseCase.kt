package com.bortnik.chiron.application.usecase.veterinarian

import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class DeleteVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    fun delete(id: UUID) {
        if (!veterinarianRepository.deleteById(id)) throw VeterinarianNotFoundException(id)
    }
}
