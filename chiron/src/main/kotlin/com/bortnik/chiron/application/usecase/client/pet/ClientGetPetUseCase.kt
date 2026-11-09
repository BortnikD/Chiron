package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.dto.pet.PetDetailsDto
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.dto.pet.PetSummaryDto
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetPetUseCase(
    private val getPetUseCase: GetPetUseCase,
    private val accessGuard: ResourceAccessGuard,
    private val getPetSummaryUseCase: ClientGetPetSummaryUseCase,
) {

    fun findAll(actor: Actor, isArchived: Boolean?, withSummary: Boolean = false): List<PetDetailsDto> {
        val pets = getPetUseCase.findAll(PetFilter(ownerId = actor.userId, isArchived = isArchived))
        return withSummaries(actor, pets, withSummary)
    }

    fun findById(actor: Actor, id: UUID, withSummary: Boolean = false): PetDetailsDto =
        withSummaries(actor, listOf(accessGuard.requireOwnedPet(actor, id)), withSummary).single()

    private fun withSummaries(actor: Actor, pets: List<Pet>, withSummary: Boolean): List<PetDetailsDto> {
        if (!withSummary || pets.isEmpty()) return pets.map { PetDetailsDto(it) }
        val summaries = getPetSummaryUseCase.findAll(actor, pets.map { it.id })
        return pets.map { PetDetailsDto(it, summaries[it.id] ?: PetSummaryDto()) }
    }
}
