package com.bortnik.chiron.application.usecase.veterinarian.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class VeterinarianCreateVaccinationUseCase(
    private val createVaccinationUseCase: CreateVaccinationUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun create(actor: Actor, dto: CreateVaccinationDto): Vaccination {
        accessGuard.requirePatient(actor, dto.petId)
        val vaccination = createVaccinationUseCase.create(dto)
        log.info(
            "Veterinarian {} ({}) recorded vaccination {} '{}' for pet {}",
            actor.userId,
            actor.fullName,
            vaccination.id,
            vaccination.name,
            vaccination.petId,
        )
        return vaccination
    }
}
