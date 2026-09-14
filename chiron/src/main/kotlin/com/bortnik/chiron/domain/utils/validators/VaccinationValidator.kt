package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.utils.ValidationConstants.VaccinationRules
import java.time.LocalDate

object VaccinationValidator {

    fun validate(dto: CreateVaccinationDto) = validateAll { vaccination(dto.name, dto.administeredOn, dto.nextDueOn) }

    fun validate(dto: UpdateVaccinationDto) = validateAll { vaccination(dto.name, dto.administeredOn, dto.nextDueOn) }

    private fun ValidationErrorCollector.vaccination(name: String, administeredOn: LocalDate, nextDueOn: LocalDate?) {
        ensureNotBlank("name", name)
        ensureMaxLength("name", name, VaccinationRules.NAME_MAX_LENGTH)
        ensure(!administeredOn.isAfter(LocalDate.now()), "administeredOn", "must not be in the future")
        ensure(nextDueOn == null || nextDueOn.isAfter(administeredOn), "nextDueOn", "must be after administeredOn")
    }
}
