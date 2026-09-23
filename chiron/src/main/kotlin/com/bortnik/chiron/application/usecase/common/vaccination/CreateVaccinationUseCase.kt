package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class CreateVaccinationUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val appointmentRepository: AppointmentRepository,
) {

    fun create(dto: CreateVaccinationDto): Vaccination {
        VaccinationValidator.validate(dto)
        dto.appointmentId?.let { appointmentId ->
            val appointment = appointmentRepository.findById(appointmentId)
                ?: throw AppointmentNotFoundException(appointmentId)
            if (appointment.petId != dto.petId) throw AppointmentPetMismatchException(appointmentId, dto.petId)
        }
        return vaccinationRepository.create(dto)
    }
}
