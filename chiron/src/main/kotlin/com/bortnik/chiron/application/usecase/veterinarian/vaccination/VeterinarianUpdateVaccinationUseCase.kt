package com.bortnik.chiron.application.usecase.veterinarian.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.vaccination.UpdateVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class VeterinarianUpdateVaccinationUseCase(
    private val updateVaccinationUseCase: UpdateVaccinationUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun update(actor: Actor, id: UUID, dto: UpdateVaccinationDto): Vaccination {
        accessGuard.requirePatientVaccination(actor, id)
        val vaccination = updateVaccinationUseCase.update(id, dto)
        log.info(
            "Veterinarian {} ({}) updated vaccination {} '{}' of pet {}",
            actor.userId,
            actor.fullName,
            vaccination.id,
            vaccination.name,
            vaccination.petId,
        )
        return vaccination
    }
}
