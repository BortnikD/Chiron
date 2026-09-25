package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetVeterinarianUseCase(private val getVeterinarianUseCase: GetVeterinarianUseCase) {

    fun findByUserId(actor: Actor, userId: UUID): Veterinarian = getVeterinarianUseCase.findByUserId(userId)

    fun findAll(actor: Actor, filter: VeterinarianFilter): List<Veterinarian> = getVeterinarianUseCase.findAll(filter)
}
