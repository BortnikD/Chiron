package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.species.CreateSpeciesDto
import com.bortnik.chiron.domain.dto.species.UpdateSpeciesDto
import com.bortnik.chiron.domain.entities.Species
import java.util.UUID

interface SpeciesRepository {
    fun create(dto: CreateSpeciesDto): Species

    fun findById(id: UUID): Species?

    fun findByName(name: String): Species?

    fun findAll(): List<Species>

    fun update(id: UUID, dto: UpdateSpeciesDto): Species?

    fun deleteById(id: UUID): Boolean
}
