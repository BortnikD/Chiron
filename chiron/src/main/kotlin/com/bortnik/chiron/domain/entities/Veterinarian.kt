package com.bortnik.chiron.domain.entities

import com.bortnik.chiron.domain.exceptions.rules.VeterinarianServiceSpecializationMismatchException
import java.time.Instant
import java.util.UUID

data class Veterinarian(
    val id: UUID,
    val userId: UUID,
    val specializationId: UUID,
    val bio: String? = null,
    val photoKey: String? = null,
    val experienceYears: Int,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant,
    val specializationIds: List<UUID> = listOf(specializationId),
) {
    fun requireSpecialization(id: UUID) {
        if (id !in specializationIds) throw VeterinarianServiceSpecializationMismatchException(this.id, id)
    }
}
