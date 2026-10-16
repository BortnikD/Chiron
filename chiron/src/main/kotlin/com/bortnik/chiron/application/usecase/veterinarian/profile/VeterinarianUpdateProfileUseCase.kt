package com.bortnik.chiron.application.usecase.veterinarian.profile

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.veterinarian.UpdateVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.UpdateOwnVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class VeterinarianUpdateProfileUseCase(
    private val updateVeterinarianUseCase: UpdateVeterinarianUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, dto: UpdateOwnVeterinarianDto): Veterinarian {
        val profile = accessGuard.requireVeterinarian(actor)
        val veterinarian = updateVeterinarianUseCase.update(
            profile.id,
            UpdateVeterinarianDto(bio = dto.bio, photoUrl = dto.photoUrl, experienceYears = dto.experienceYears),
        )
        log.info(
            "Veterinarian {} ({}) updated own veterinarian profile {}",
            actor.userId,
            actor.fullName,
            veterinarian.id,
        )
        return veterinarian
    }
}
