package com.bortnik.chiron.application.usecase.admin.pet

import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.pet.PetFilter
import com.bortnik.chiron.domain.entities.Pet
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetPetUseCase(private val getPetUseCase: GetPetUseCase) {

    fun findById(id: UUID): Pet = getPetUseCase.findById(id)

    fun findAll(filter: PetFilter, pageRequest: PageRequest): Page<Pet> =
        getPetUseCase.findAll(filter, pageRequest)
}
