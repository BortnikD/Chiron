package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentPetMismatchException
import com.bortnik.chiron.domain.exceptions.rules.FollowUpNotAllowedException
import com.bortnik.chiron.domain.exceptions.rules.PetArchivedException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.domain.utils.AppointmentStatusRules
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import com.bortnik.chiron.domain.utils.validators.validateAll
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.util.UUID

@Service
@Transactional
class CreateAppointmentUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val resolveServices: ResolveAppointmentServicesUseCase,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
) {
    fun create(dto: CreateAppointmentDto, actorId: UUID? = null): Appointment {
        AppointmentValidator.validate(dto)
        validateAll {
            ensure(
                dto.status == AppointmentStatus.PENDING || dto.status == AppointmentStatus.CONFIRMED,
                "status",
                "new appointments must be PENDING or CONFIRMED",
            )
        }
        val pet = petRepository.findById(dto.petId) ?: throw PetNotFoundException(dto.petId)
        if (pet.isArchived) throw PetArchivedException(pet.id)
        dto.followUpOf?.let { checkFollowUp(it, dto) }
        val veterinarian = veterinarianRepository.findById(dto.veterinarianId)
            ?: throw VeterinarianNotFoundException(dto.veterinarianId)
        if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
        if (!permissionRepository.exists(veterinarian.id, pet.speciesId)) {
            throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, pet.speciesId)
        }
        val resolved = resolveServices.resolvePlanned(dto.serviceIds, pet.speciesId, actorId)
        AppointmentValidator.validateDurationMinutes(resolved.durationMin.toLong() + resolved.bufferAfterMin)
        veterinarian.requireSpecialization(resolved.specializationId)
        val endAt = dto.startAt + Duration.ofMinutes(resolved.durationMin.toLong() + resolved.bufferAfterMin)
        validateAll {
            ensure(
                dto.endAt == endAt,
                "endAt",
                "must match the total service duration including the shared buffer"
            )
        }
        checkAvailability.check(veterinarian.id, dto.startAt, endAt)
        return appointmentRepository.create(dto, resolved.services)
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
