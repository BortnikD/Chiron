package com.bortnik.chiron.application.usecase.client.pet

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.pet.PetSummaryDto
import com.bortnik.chiron.domain.repositories.PetSummaryRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ClientGetPetSummaryUseCase(
    private val summaryRepository: PetSummaryRepository,
    private val clinicProperties: ClinicProperties,
    private val clock: Clock,
) {
    fun findAll(actor: Actor, petIds: List<UUID>): Map<UUID, PetSummaryDto> {
        if (petIds.isEmpty()) return emptyMap()
        val now = clock.instant()
        val today = now.atZone(clinicProperties.zoneId).toLocalDate()
        return summaryRepository.findAll(actor.userId, petIds, now).mapValues { (_, summary) ->
            summary.copy(hasOverdueVaccination = summary.nextVaccinationDueOn?.isBefore(today) == true)
        }
    }
}
