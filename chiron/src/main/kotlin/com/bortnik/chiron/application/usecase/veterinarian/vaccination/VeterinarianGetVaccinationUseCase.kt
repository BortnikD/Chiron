package com.bortnik.chiron.application.usecase.veterinarian.vaccination

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.vaccination.GetVaccinationUseCase
import com.bortnik.chiron.domain.dto.pagination.Page
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.dto.vaccination.VeterinarianVaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class VeterinarianGetVaccinationUseCase(
    private val getVaccinationUseCase: GetVaccinationUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    fun findAll(actor: Actor, filter: VeterinarianVaccinationFilter, pageRequest: PageRequest): Page<Vaccination> {
        filter.petId?.let { accessGuard.requirePatient(actor, it) }
        val scoped = VaccinationFilter(
            petId = filter.petId,
            patientOfVeterinarianId = accessGuard.requireVeterinarian(actor).id,
            name = filter.name,
            nextDueFrom = filter.nextDueFrom,
            nextDueTo = filter.nextDueTo,
        )
        return getVaccinationUseCase.findAll(scoped, pageRequest)
    }
}
