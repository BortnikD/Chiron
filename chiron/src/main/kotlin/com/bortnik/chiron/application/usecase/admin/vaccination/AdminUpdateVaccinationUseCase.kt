package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.vaccination.UpdateVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminUpdateVaccinationUseCase(private val updateVaccinationUseCase: UpdateVaccinationUseCase) {

    fun update(actor: Actor, id: UUID, dto: UpdateVaccinationDto): Vaccination =
        updateVaccinationUseCase.update(id, dto)
}
