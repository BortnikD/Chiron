package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.entities.Veterinarian
import java.util.UUID

interface VeterinarianRepository {
    fun create(dto: CreateVeterinarianDto): Veterinarian

    fun findById(id: UUID): Veterinarian?

    fun findByUserId(userId: UUID): Veterinarian?

    fun findAll(): List<Veterinarian>

    fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian?

    fun deleteById(id: UUID): Boolean
}
