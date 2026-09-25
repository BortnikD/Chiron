package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetVaccinationUseCase(private val getVaccinationUseCase: GetVaccinationUseCase) {

    fun findById(actor: Actor, id: UUID): Vaccination = getVaccinationUseCase.findById(id)

    fun findAll(actor: Actor, filter: VaccinationFilter, pageRequest: PageRequest): Page<Vaccination> =
        getVaccinationUseCase.findAll(filter, pageRequest)
}
