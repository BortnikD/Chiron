package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.domain.dto.appointment.AvailableSlot
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianServiceSpecializationMismatchException
import com.bortnik.chiron.domain.repositories.SpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
@Transactional(readOnly = true)
class FindAvailableSlotsUseCase(
    private val speciesRepository: SpeciesRepository,
    private val resolveServices: ResolveAppointmentServicesUseCase,
    private val veterinarianRepository: VeterinarianRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
    private val clinicProperties: ClinicProperties,
) {
    fun find(filter: AvailableSlotFilter): List<AvailableSlot> {
        AppointmentValidator.validate(filter)
        if (speciesRepository.findById(filter.speciesId) == null) throw SpeciesNotFoundException(filter.speciesId)
        val resolved = resolveServices.resolve(filter.serviceIds, filter.speciesId)
        AppointmentValidator.validateDurationMinutes(resolved.durationMin.toLong() + resolved.bufferAfterMin)
        val duration = Duration.ofMinutes(resolved.durationMin.toLong() + resolved.bufferAfterMin)
        val now = Instant.now()
        val dates = filter.from.datesUntil(filter.to.plusDays(1)).toList()
        val veterinarianIdsByStart = sortedMapOf<Instant, MutableList<UUID>>()
        for (veterinarian in findVeterinarians(filter, resolved.specializationId)) {
            val availability = checkAvailability.availabilityOf(
                veterinarian.id,
                filter.from.atStartOfDay(clinicProperties.zoneId).toInstant(),
                filter.to.plusDays(1).atStartOfDay(clinicProperties.zoneId).toInstant(),
            )
            dates.flatMap { availability.freeSlotStarts(it, duration) }
                .filter { it > now }
                .forEach { veterinarianIdsByStart.getOrPut(it) { mutableListOf() } += veterinarian.id }
        }
        return veterinarianIdsByStart.map { (startAt, veterinarianIds) ->
            AvailableSlot(startAt = startAt, endAt = startAt + duration, veterinarianIds = veterinarianIds)
        }
    }

    private fun findVeterinarians(filter: AvailableSlotFilter, specializationId: UUID): List<Veterinarian> {
        val veterinarianId = filter.veterinarianId
            ?: return veterinarianRepository.findAll(
                VeterinarianFilter(specializationId = specializationId, speciesId = filter.speciesId, isActive = true),
            )
        val veterinarian = veterinarianRepository.findById(veterinarianId)
            ?: throw VeterinarianNotFoundException(veterinarianId)
        if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
        if (!permissionRepository.exists(veterinarian.id, filter.speciesId)) {
            throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, filter.speciesId)
        }
        if (veterinarian.specializationId != specializationId) {
            throw VeterinarianServiceSpecializationMismatchException(veterinarian.id, specializationId)
        }
        return listOf(veterinarian)
    }
}
