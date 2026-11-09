package com.bortnik.chiron.application.usecase.veterinarian.profile

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class VeterinarianGetProfileUseCase(private val getVeterinarianUseCase: GetVeterinarianUseCase) {

    fun get(actor: Actor): VeterinarianDetailsDto = getVeterinarianUseCase.findByUserId(actor.userId)
}
