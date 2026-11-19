package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.ResolvedAppointmentServices
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.domain.entities.Service as CatalogService
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.exceptions.rules.ServiceInactiveException
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.utils.validators.AppointmentValidator
import com.bortnik.chiron.domain.utils.validators.validateAll
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ResolveAppointmentServicesUseCase(
    private val serviceRepository: ServiceRepository,
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
) {
    fun resolvePlanned(
        serviceIds: List<UUID>, speciesId: UUID, actorId: UUID? = null,
    ): ResolvedAppointmentServices {
        AppointmentValidator.validateServiceIds(serviceIds)
        val selected = findSelected(serviceIds)
        val snapshots = snapshots(selected, speciesId, actorId)
        val specializationId = selected.first().specializationId
        validateAll {
            ensure(
                selected.all { it.specializationId == specializationId },
                "serviceIds",
                "all services must have the same specialization",
            )
        }
        return ResolvedAppointmentServices(snapshots, specializationId)
    }

    fun resolvePerformedAdditions(
        serviceIds: List<UUID>,
        existingIds: Set<UUID>,
        speciesId: UUID,
        veterinarian: Veterinarian,
        actorId: UUID?,
    ): List<AppointmentService> {
        val selected = findSelected(serviceIds)
        selected.forEach { veterinarian.requireSpecialization(it.specializationId) }
        return snapshots(selected.filterNot { it.id in existingIds }, speciesId, actorId)
    }

    private fun findSelected(ids: List<UUID>): List<CatalogService> {
        val services = serviceRepository.findAllByIds(ids).associateBy { it.id }
        return ids.map { services[it] ?: throw ServiceNotFoundException(it) }
    }

    private fun snapshots(services: List<CatalogService>, speciesId: UUID, actorId: UUID?): List<AppointmentService> {
        if (services.isEmpty()) return emptyList()
        val overrides = serviceSpeciesRepository.findAllBySpeciesId(speciesId).associateBy { it.serviceId }
        return services.map { service ->
            if (!service.isActive) throw ServiceInactiveException(service.id)
            val override = overrides[service.id] ?: throw ServiceNotAvailableForSpeciesException(service.id, speciesId)
            AppointmentService(
                serviceId = service.id,
                nameSnapshot = service.name,
                priceSnapshot = override.price ?: service.basePrice,
                durationMinSnapshot = override.durationMin ?: service.baseDurationMin,
                bufferAfterMinSnapshot = service.bufferAfterMin,
                addedBy = actorId,
            )
        }
    }
}
