package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.entities.Pet
import java.util.UUID

interface PetRepository {
    fun create(dto: CreatePetDto): Pet

    fun findById(id: UUID): Pet?

    fun findAllByOwnerId(ownerId: UUID): List<Pet>

    fun findAll(): List<Pet>

    fun update(id: UUID, dto: UpdatePetDto): Pet?

    fun deleteById(id: UUID): Boolean
}
