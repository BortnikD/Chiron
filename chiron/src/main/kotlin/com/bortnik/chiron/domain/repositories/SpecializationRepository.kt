package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.specialization.CreateSpecializationDto
import com.bortnik.chiron.domain.dto.specialization.UpdateSpecializationDto
import com.bortnik.chiron.domain.entities.Specialization
import java.util.UUID

interface SpecializationRepository {
    fun create(dto: CreateSpecializationDto): Specialization

    fun findById(id: UUID): Specialization?

    fun findAll(): List<Specialization>

    fun update(id: UUID, dto: UpdateSpecializationDto): Specialization?

    fun deleteById(id: UUID): Boolean
}
