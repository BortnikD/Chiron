package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateVaccinationUseCase(private val createVaccinationUseCase: CreateVaccinationUseCase) {

    fun create(actor: Actor, dto: CreateVaccinationDto): Vaccination = createVaccinationUseCase.create(dto)
}
