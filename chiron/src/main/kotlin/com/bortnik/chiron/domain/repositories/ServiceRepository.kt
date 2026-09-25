package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.service.CreateServiceDto
import com.bortnik.chiron.domain.dto.service.ServiceFilter
import com.bortnik.chiron.domain.dto.service.UpdateServiceDto
import com.bortnik.chiron.domain.entities.Service
import java.util.UUID

interface ServiceRepository {
    fun create(dto: CreateServiceDto): Service

    fun findById(id: UUID): Service?

    fun findAll(filter: ServiceFilter): List<Service>

    fun update(id: UUID, dto: UpdateServiceDto): Service?

    fun deleteById(id: UUID): Boolean
}
