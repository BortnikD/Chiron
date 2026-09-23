package com.bortnik.chiron.application.usecase.common.veterinarian

import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class GetVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    fun findById(id: UUID): Veterinarian =
        veterinarianRepository.findById(id) ?: throw VeterinarianNotFoundException(id)

    fun findByUserId(userId: UUID): Veterinarian =
        veterinarianRepository.findByUserId(userId) ?: throw VeterinarianNotFoundException("userId", userId)

    fun findAll(): List<Veterinarian> = veterinarianRepository.findAll()
}
