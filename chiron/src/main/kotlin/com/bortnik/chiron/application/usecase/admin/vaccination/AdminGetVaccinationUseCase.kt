package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AdminGetVaccinationUseCase(private val getVaccinationUseCase: GetVaccinationUseCase) {

    fun findById(actor: Actor, id: UUID): Vaccination = getVaccinationUseCase.findById(id)

    fun findAllByPetId(actor: Actor, petId: UUID): List<Vaccination> = getVaccinationUseCase.findAllByPetId(petId)
}
