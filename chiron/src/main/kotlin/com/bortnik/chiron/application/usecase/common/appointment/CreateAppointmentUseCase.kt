package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.exceptions.rules.FollowUpNotAllowedException
import com.bortnik.chiron.domain.exceptions.rules.PetArchivedException
import com.bortnik.chiron.domain.exceptions.rules.ServiceInactiveException
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.domain.utils.AppointmentStatusRules
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class CreateAppointmentUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val serviceRepository: ServiceRepository,
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
) {

    fun create(dto: CreateAppointmentDto): Appointment {
        AppointmentValidator.validate(dto)

        val pet = petRepository.findById(dto.petId) ?: throw PetNotFoundException(dto.petId)
        if (pet.isArchived) throw PetArchivedException(pet.id)

        dto.followUpOf?.let { checkFollowUp(it, dto) }

        val veterinarian = veterinarianRepository.findById(dto.veterinarianId)
            ?: throw VeterinarianNotFoundException(dto.veterinarianId)
        if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
        if (!permissionRepository.exists(veterinarian.id, pet.speciesId)) {
            throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, pet.speciesId)
        }

        val service = serviceRepository.findById(dto.serviceId) ?: throw ServiceNotFoundException(dto.serviceId)
        if (!service.isActive) throw ServiceInactiveException(service.id)
        if (serviceSpeciesRepository.findById(service.id, pet.speciesId) == null) {
            throw ServiceNotAvailableForSpeciesException(service.id, pet.speciesId)
        }

        checkAvailability.check(veterinarian.id, dto.startAt, dto.endAt)
        return appointmentRepository.create(dto)
    }

    private fun checkFollowUp(originalId: UUID, dto: CreateAppointmentDto) {
        val original = appointmentRepository.findById(originalId) ?: throw AppointmentNotFoundException(originalId)
        if (original.petId != dto.petId) throw AppointmentPetMismatchException(original.id, dto.petId)
        if (!AppointmentStatusRules.allowsFollowUp(original.status)) {
            throw FollowUpNotAllowedException(original.id, "original appointment is ${original.status}")
        }
        if (dto.startAt < original.endAt) {
            throw FollowUpNotAllowedException(original.id, "follow-up must start after the original appointment ends")
        }
    }
}
