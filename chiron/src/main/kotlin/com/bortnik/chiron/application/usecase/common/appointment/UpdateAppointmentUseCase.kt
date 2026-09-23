package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.InvalidAppointmentStatusTransitionException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.domain.utils.AppointmentStatusRules
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class UpdateAppointmentUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
) {

    fun update(id: UUID, dto: UpdateAppointmentDto): Appointment {
        AppointmentValidator.validate(dto)
        val existing = appointmentRepository.findById(id) ?: throw AppointmentNotFoundException(id)

        if (!AppointmentStatusRules.canTransition(existing.status, dto.status)) {
            throw InvalidAppointmentStatusTransitionException(id, existing.status, dto.status)
        }

        val rescheduled = dto.veterinarianId != existing.veterinarianId ||
            dto.startAt != existing.startAt ||
            dto.endAt != existing.endAt
        if (rescheduled) {
            val veterinarian = veterinarianRepository.findById(dto.veterinarianId)
                ?: throw VeterinarianNotFoundException(dto.veterinarianId)
            if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
            val pet = petRepository.findById(existing.petId) ?: throw PetNotFoundException(existing.petId)
            if (!permissionRepository.exists(veterinarian.id, pet.speciesId)) {
                throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, pet.speciesId)
            }
            checkAvailability.check(veterinarian.id, dto.startAt, dto.endAt, excludeAppointmentId = id)
        }

        return appointmentRepository.update(id, dto) ?: throw AppointmentNotFoundException(id)
    }
}
