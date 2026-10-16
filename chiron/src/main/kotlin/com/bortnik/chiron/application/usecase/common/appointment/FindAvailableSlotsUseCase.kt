package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.AvailableSlot
import com.bortnik.chiron.domain.dto.appointment.AvailableSlotFilter
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.SpeciesNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.ServiceInactiveException
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
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
    private val serviceRepository: ServiceRepository,
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val permissionRepository: VeterinarianSpeciesPermissionRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
) {

    // A slot is as long as the booking will be (species-specific duration plus the buffer), so any returned
    // slot can be booked as is. Slots of all candidate veterinarians are merged by start time.
    fun find(filter: AvailableSlotFilter): List<AvailableSlot> {
        AppointmentValidator.validate(filter)

        if (speciesRepository.findById(filter.speciesId) == null) throw SpeciesNotFoundException(filter.speciesId)
        val service = serviceRepository.findById(filter.serviceId) ?: throw ServiceNotFoundException(filter.serviceId)
        if (!service.isActive) throw ServiceInactiveException(service.id)
        val serviceSpecies = serviceSpeciesRepository.findById(service.id, filter.speciesId)
            ?: throw ServiceNotAvailableForSpeciesException(service.id, filter.speciesId)
        val duration = Duration.ofMinutes(
            ((serviceSpecies.durationMin ?: service.baseDurationMin) + service.bufferAfterMin).toLong(),
        )

        val now = Instant.now()
        val dates = filter.from.datesUntil(filter.to.plusDays(1)).toList()
        val veterinarianIdsByStart = sortedMapOf<Instant, MutableList<UUID>>()
        for (veterinarian in findVeterinarians(filter)) {
            val availability = checkAvailability.availabilityOf(veterinarian.id)
            dates.flatMap { availability.freeSlotStarts(it, duration) }
                .filter { it > now }
                .forEach { veterinarianIdsByStart.getOrPut(it) { mutableListOf() } += veterinarian.id }
        }
        return veterinarianIdsByStart.map { (startAt, veterinarianIds) ->
            AvailableSlot(startAt = startAt, endAt = startAt + duration, veterinarianIds = veterinarianIds)
        }
    }

    // Booking rejects inactive veterinarians and those without a permission for the species, so they are skipped
    // in the clinic-wide search and rejected when asked for explicitly.
    private fun findVeterinarians(filter: AvailableSlotFilter): List<Veterinarian> {
        val veterinarianId = filter.veterinarianId
            ?: return veterinarianRepository.findAll(VeterinarianFilter(speciesId = filter.speciesId, isActive = true))
        val veterinarian = veterinarianRepository.findById(veterinarianId)
            ?: throw VeterinarianNotFoundException(veterinarianId)
        if (!veterinarian.isActive) throw VeterinarianInactiveException(veterinarian.id)
        if (!permissionRepository.exists(veterinarian.id, filter.speciesId)) {
            throw VeterinarianNotPermittedForSpeciesException(veterinarian.id, filter.speciesId)
        }
        return listOf(veterinarian)
    }
}
