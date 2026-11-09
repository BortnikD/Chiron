package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.pet.PetSummaryDto
import java.time.Instant
import java.util.UUID

interface PetSummaryRepository {
    fun findAll(ownerId: UUID, petIds: List<UUID>, now: Instant): Map<UUID, PetSummaryDto>
}
