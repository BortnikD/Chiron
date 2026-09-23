package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.utils.validators.VeterinarianValidator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateVeterinarianUseCase(private val veterinarianRepository: VeterinarianRepository) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateVeterinarianDto): Veterinarian {
        VeterinarianValidator.validate(dto)
        val veterinarian = veterinarianRepository.update(id, dto) ?: throw VeterinarianNotFoundException(id)
        log.info(
            "Admin {} ({}) updated veterinarian {}: specialization {}, active {}",
            actor.userId,
            actor.fullName,
            veterinarian.id,
            veterinarian.specializationId,
            veterinarian.isActive,
        )
        return veterinarian
    }
}
