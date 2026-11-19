package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.InvalidAppointmentStatusTransitionException
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
import java.time.Clock
import java.time.Duration
import java.util.UUID

@Service
@Transactional
class UpdateAppointmentUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
    private val resolveServices: ResolveAppointmentServicesUseCase,
    private val clock: Clock,
) {
    fun update(id: UUID, dto: UpdateAppointmentDto, actorId: UUID? = null): Appointment {
        val existing = appointmentRepository.findByIdForUpdate(id) ?: throw AppointmentNotFoundException(id)
        val now = clock.instant()
        val command = if (dto.status == AppointmentStatus.CANCELLED) {
            if (existing.status == AppointmentStatus.CANCELLED) {
                dto.copy(cancelledBy = Patch.Unchanged, cancelledAt = Patch.Unchanged, cancelReason = Patch.Unchanged)
            } else {
                dto.copy(
                    cancelledBy = actorId?.let { Patch.Value(it) } ?: dto.cancelledBy,
                    cancelledAt = Patch.Value(now),
                )
            }
        } else {
            dto
        }
        val status = command.status ?: existing.status
        if (!AppointmentStatusRules.canTransition(existing.status, status)) {
            throw InvalidAppointmentStatusTransitionException(id, existing.status, status)
        }
        validateAll {
            ensure(
                status !in setOf(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW) ||
                        existing.services.none { it.isPerformed == true },
                "status",
                "an appointment with performed services cannot be cancelled or marked as no-show",
            )
            ensure(
                existing.status == AppointmentStatus.COMPLETED || status != AppointmentStatus.COMPLETED ||
                        dto.performedServiceIds != null,
                "performedServiceIds",
                "is required when completing the appointment",
            )
        }
        var services = existing.services
        if (dto.serviceIds != null) {
            validateAll {
                ensure(
                    existing.status in setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED) &&
                            now < existing.startAt,
                    "serviceIds",
                    "planned services can only be changed before the appointment starts",
                )
            }
            services = replacePlannedServices(existing, dto.serviceIds, actorId)
        }

        val veterinarianId = dto.veterinarianId ?: existing.veterinarianId
        val startAt = dto.startAt ?: existing.startAt
        val minimumDuration = minimumDuration(existing.copy(services = services))
        val endAt = dto.endAt ?: when {
            dto.serviceIds != null -> startAt + minimumDuration
            startAt != existing.startAt -> startAt + Duration.between(existing.startAt, existing.endAt)
            else -> existing.endAt
        }
        val update = command.copy(
            endAt = endAt.takeIf { it != existing.endAt } ?: command.endAt,
            serviceIds = null,
            performedServiceIds = null,
        )
        AppointmentValidator.validate(existing, command.copy(startAt = startAt, endAt = endAt))
        val rescheduled =
            veterinarianId != existing.veterinarianId || startAt != existing.startAt || endAt != existing.endAt
        if (rescheduled || dto.serviceIds != null) {
            validateAll {
                ensure(
                    existing.status in setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                    "startAt",
                    "the schedule of a terminal appointment cannot be changed",
                )
                ensure(
                    endAt >= startAt + minimumDuration,
                    "endAt",
                    "must include all planned services and the shared buffer"
                )
                if (now >= existing.startAt) {
                    ensure(
                        existing.status == AppointmentStatus.CONFIRMED &&
                                veterinarianId == existing.veterinarianId && startAt == existing.startAt &&
                                endAt >= existing.endAt,
                        "endAt",
                        "a started appointment can only be extended",
                    )
                } else {
                    ensure(startAt > now, "startAt", "must be in the future")
                }
            }
            val veterinarian = veterinarianRepository.findById(veterinarianId)
                ?: throw VeterinarianNotFoundException(veterinarianId)
            if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
            val pet = petRepository.findById(existing.petId) ?: throw PetNotFoundException(existing.petId)
            if (pet.isArchived) throw PetArchivedException(pet.id)
            if (!permissionRepository.exists(veterinarian.id, pet.speciesId)) {
                throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, pet.speciesId)
            }
            val resolved =
                resolveServices.resolvePlanned(services.filter { it.isPlanned }.map { it.serviceId }, pet.speciesId)
            veterinarian.requireSpecialization(resolved.specializationId)
            checkAvailability.check(veterinarian.id, startAt, endAt, excludeAppointmentId = id)
        }

        if (dto.performedServiceIds != null) {
            validateAll {
                ensure(
                    status in setOf(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED) && now >= startAt,
                    "performedServiceIds",
                    "performed services can only be recorded during or after a confirmed appointment",
                )
            }
            services = recordPerformedServices(existing.copy(services = services), dto.performedServiceIds, actorId)
        }
        if (services != existing.services) {
            appointmentRepository.replaceServices(id, services) ?: throw AppointmentNotFoundException(id)
        }
        return appointmentRepository.update(id, update) ?: throw AppointmentNotFoundException(id)
    }

    private fun replacePlannedServices(
        appointment: Appointment, serviceIds: List<UUID>, actorId: UUID?,
    ): List<AppointmentService> {
        val pet = petRepository.findById(appointment.petId) ?: throw PetNotFoundException(appointment.petId)
        val resolved = resolveServices.resolvePlanned(serviceIds, pet.speciesId, actorId)
        val existing = appointment.services.associateBy { it.serviceId }
        return resolved.services.map { fresh ->
            val retained = existing[fresh.serviceId]
            when {
                retained == null -> fresh
                retained.durationMinSnapshot == null || retained.bufferAfterMinSnapshot == null -> retained.copy(
                    durationMinSnapshot = retained.durationMinSnapshot ?: fresh.durationMinSnapshot,
                    bufferAfterMinSnapshot = retained.bufferAfterMinSnapshot ?: fresh.bufferAfterMinSnapshot,
                    updatedBy = actorId,
                    updatedAt = clock.instant(),
                )

                else -> retained
            }
        }
    }

    private fun recordPerformedServices(
        appointment: Appointment, serviceIds: List<UUID>, actorId: UUID?,
    ): List<AppointmentService> {
        val added = if (serviceIds.isEmpty()) emptyList() else {
            val veterinarian = veterinarianRepository.findById(appointment.veterinarianId)
                ?: throw VeterinarianNotFoundException(appointment.veterinarianId)
            val pet = petRepository.findById(appointment.petId) ?: throw PetNotFoundException(appointment.petId)
            resolveServices.resolvePerformedAdditions(
                serviceIds, appointment.services.map { it.serviceId }.toSet(), pet.speciesId, veterinarian, actorId,
            ).map { it.copy(isPlanned = false, isPerformed = true) }
        }
        val selected = serviceIds.toSet()
        val now = clock.instant()
        return appointment.services.map { service ->
            val performed = service.serviceId in selected
            if (service.isPerformed == performed) service else {
                service.copy(isPerformed = performed, updatedBy = actorId, updatedAt = now)
            }
        } + added
    }

    private fun minimumDuration(appointment: Appointment): Duration {
        val durationMin = appointment.durationMin
        val bufferAfterMin = appointment.bufferAfterMin
        // Historical component durations are unknown; retain the originally reserved interval.
        return if (durationMin == null || bufferAfterMin == null) {
            Duration.between(appointment.startAt, appointment.endAt)
        } else {
            Duration.ofMinutes(durationMin.toLong() + bufferAfterMin)
        }
    }
}
