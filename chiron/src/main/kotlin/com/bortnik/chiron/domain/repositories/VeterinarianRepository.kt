package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import java.util.UUID

interface VeterinarianRepository {
    fun create(dto: CreateVeterinarianDto): Veterinarian

    fun findById(id: UUID): Veterinarian?

    fun findByUserId(userId: UUID): Veterinarian?

    fun findAll(filter: VeterinarianFilter): List<Veterinarian>

    fun findDetailsById(id: UUID): VeterinarianDetailsDto?

    fun findDetailsByUserId(userId: UUID): VeterinarianDetailsDto?

    fun findAllDetails(filter: VeterinarianFilter): List<VeterinarianDetailsDto>

    fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian?

    fun deleteById(id: UUID): Boolean
}
