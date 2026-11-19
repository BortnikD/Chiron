package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.appointment.ResolvedAppointmentServices
import com.bortnik.chiron.domain.entities.AppointmentService
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
    fun resolve(serviceIds: List<UUID>, speciesId: UUID, actorId: UUID? = null): ResolvedAppointmentServices {
        AppointmentValidator.validateServiceIds(serviceIds)
        val services = serviceRepository.findAllByIds(serviceIds).associateBy { it.id }
        val overrides = serviceSpeciesRepository.findAllBySpeciesId(speciesId).associateBy { it.serviceId }
        val selected = serviceIds.map { id ->
            val service = services[id] ?: throw ServiceNotFoundException(id)
            if (!service.isActive) throw ServiceInactiveException(id)
            if (id !in overrides) throw ServiceNotAvailableForSpeciesException(id, speciesId)
            service
        }
        val specializationId = selected.first().specializationId
        validateAll {
            ensure(
                selected.all { it.specializationId == specializationId },
                "serviceIds",
                "all services must have the same specialization",
            )
        }
        val resolved = ResolvedAppointmentServices(
            services = selected.map { service ->
                val override = overrides.getValue(service.id)
                AppointmentService(
                    serviceId = service.id,
                    nameSnapshot = service.name,
                    priceSnapshot = override.price ?: service.basePrice,
                    durationMinSnapshot = override.durationMin ?: service.baseDurationMin,
                    bufferAfterMinSnapshot = service.bufferAfterMin,
                    addedBy = actorId,
                )
            },
            specializationId = specializationId,
        )
        return resolved
    }
}
