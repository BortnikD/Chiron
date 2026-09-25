package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.utils.ValidationConstants.SEARCH_MAX_LENGTH
import com.bortnik.chiron.domain.utils.ValidationConstants.VaccinationRules
import java.time.LocalDate

object VaccinationValidator {

    fun validate(filter: VaccinationFilter) = validateAll {
        ensureMaxLength("name", filter.name, SEARCH_MAX_LENGTH)
        ensureNotBefore("nextDueTo", filter.nextDueTo, "nextDueFrom", filter.nextDueFrom)
    }

    fun validate(dto: CreateVaccinationDto) = validateAll { vaccination(dto.name, dto.administeredOn, dto.nextDueOn) }

    // Validates the state the vaccination will have once the partial update is applied.
    fun validate(existing: Vaccination, dto: UpdateVaccinationDto) = validateAll {
        vaccination(dto.name, dto.administeredOn ?: existing.administeredOn, dto.nextDueOn.orElse(existing.nextDueOn))
    }

    private fun ValidationErrorCollector.vaccination(name: String?, administeredOn: LocalDate, nextDueOn: LocalDate?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, VaccinationRules.NAME_MAX_LENGTH)
        ensure(!administeredOn.isAfter(LocalDate.now()), "administeredOn", "must not be in the future")
        ensure(nextDueOn == null || nextDueOn.isAfter(administeredOn), "nextDueOn", "must be after administeredOn")
    }
}
