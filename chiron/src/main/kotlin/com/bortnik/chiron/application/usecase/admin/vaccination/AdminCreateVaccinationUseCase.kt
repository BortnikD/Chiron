package com.bortnik.chiron.application.usecase.admin.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class AdminCreateVaccinationUseCase(private val createVaccinationUseCase: CreateVaccinationUseCase) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateVaccinationDto): Vaccination {
        val vaccination = createVaccinationUseCase.create(dto)
        log.info(
            "Admin {} ({}) recorded vaccination {} '{}' for pet {}",
            actor.userId,
            actor.fullName,
            vaccination.id,
            vaccination.name,
            vaccination.petId,
        )
        return vaccination
    }
}
