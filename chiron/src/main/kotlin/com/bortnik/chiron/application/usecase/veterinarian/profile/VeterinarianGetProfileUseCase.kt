package com.bortnik.chiron.application.usecase.veterinarian.profile

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.entities.Veterinarian
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class VeterinarianGetProfileUseCase(private val accessGuard: ResourceAccessGuard) {

    fun get(actor: Actor): Veterinarian = accessGuard.requireVeterinarian(actor)
}
