package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import java.util.UUID

interface PetRepository {
    fun create(dto: CreatePetDto): Pet

    fun findById(id: UUID): Pet?

    fun findAll(filter: PetFilter): List<Pet>

    fun findAll(filter: PetFilter, pageRequest: PageRequest): Page<Pet>

    fun update(id: UUID, dto: UpdatePetDto): Pet?

    fun deleteById(id: UUID): Boolean
}
