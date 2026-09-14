package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import java.util.UUID

interface VaccinationRepository {
    fun create(dto: CreateVaccinationDto): Vaccination

    fun findById(id: UUID): Vaccination?

    fun findAllByPetId(petId: UUID): List<Vaccination>

    fun update(id: UUID, dto: UpdateVaccinationDto): Vaccination?

    fun deleteById(id: UUID): Boolean
}
