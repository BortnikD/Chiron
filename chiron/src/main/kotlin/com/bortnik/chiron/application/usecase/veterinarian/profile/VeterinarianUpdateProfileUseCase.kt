package com.bortnik.chiron.application.usecase.veterinarian.profile

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.application.usecase.common.veterinarian.UpdateVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.UpdateOwnVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class VeterinarianUpdateProfileUseCase(
    private val updateVeterinarianUseCase: UpdateVeterinarianUseCase,
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, dto: UpdateOwnVeterinarianDto): VeterinarianDetailsDto {
        val profile = getVeterinarianUseCase.findByUserId(actor.userId)
        val veterinarian = updateVeterinarianUseCase.update(
            profile.veterinarian.id,
            UpdateVeterinarianDto(bio = dto.bio, photoUrl = dto.photoUrl, experienceYears = dto.experienceYears),
        )
        log.info(
            "Veterinarian {} ({}) updated own veterinarian profile {}",
            actor.userId,
            actor.fullName,
            veterinarian.id,
        )
        return profile.copy(veterinarian = veterinarian)
    }
}
