package com.bortnik.chiron.application.usecase.veterinarian.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class VeterinarianGetPatientUseCase(private val accessGuard: ResourceAccessGuard) {

    fun findById(actor: Actor, petId: UUID): Pet = accessGuard.requirePatient(actor, petId)
}
