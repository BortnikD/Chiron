package com.bortnik.chiron.application.usecase.common.vaccination

import com.bortnik.chiron.application.usecase.common.notification.NotifyVaccinationUseCase
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.VaccinationValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class CreateVaccinationUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val appointmentRepository: AppointmentRepository,
    private val clock: Clock,
    private val notifyVaccination: NotifyVaccinationUseCase,
) {

    fun create(dto: CreateVaccinationDto, actorId: UUID): Vaccination {
        VaccinationValidator.validate(dto, LocalDate.now(clock))
        dto.appointmentId?.let { appointmentId ->
            val appointment = appointmentRepository.findById(appointmentId)
                ?: throw AppointmentNotFoundException(appointmentId)
            if (appointment.petId != dto.petId) throw AppointmentPetMismatchException(appointmentId, dto.petId)
        }
        return vaccinationRepository.create(dto).also { notifyVaccination.notifyChange(actorId, null, it) }
    }
}
