package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.exceptions.rules.ServiceNotAvailableForSpeciesException
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.utils.validators.validateAll
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

@Service
@Transactional
class ClientBookAppointmentUseCase(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val getServiceUseCase: GetServiceUseCase,
    private val accessGuard: ResourceAccessGuard,
    private val notifyAppointmentUseCase: NotifyAppointmentUseCase,
    private val serviceSpeciesRepository: ServiceSpeciesRepository,
    private val clock: Clock,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    // The price is frozen at booking time, using the species-specific override when one exists.
    fun book(actor: Actor, dto: BookAppointmentDto): Appointment {
        validateAll { ensure(dto.startAt > clock.instant(), "startAt", "must be in the future") }
        val pet = accessGuard.requireOwnedPet(actor, dto.petId)
        val service = getServiceUseCase.findById(dto.serviceId)
        val serviceSpecies = serviceSpeciesRepository.findById(service.id, pet.speciesId)
            ?: throw ServiceNotAvailableForSpeciesException(service.id, pet.speciesId)
        val endAt = dto.startAt + Duration.ofMinutes(
            (serviceSpecies.durationMin ?: service.baseDurationMin).toLong() + service.bufferAfterMin,
        )
        validateAll { ensure(dto.endAt == endAt, "endAt", "must match the service duration including its buffer") }
        val appointment = createAppointmentUseCase.create(
            CreateAppointmentDto(
                veterinarianId = dto.veterinarianId,
                petId = dto.petId,
                serviceId = dto.serviceId,
                startAt = dto.startAt,
                endAt = endAt,
                priceSnapshot = serviceSpecies.price ?: service.basePrice,
                clientComment = dto.clientComment,
            ),
        )
        notifyAppointmentUseCase.notifyChange(actor.userId, before = null, after = appointment)
        log.info(
            "Client {} ({}) booked appointment {} for pet {} with veterinarian {} at {}, price {}",
            actor.userId,
            actor.fullName,
            appointment.id,
            appointment.petId,
            appointment.veterinarianId,
            appointment.startAt,
            appointment.priceSnapshot,
        )
        return appointment
    }
}
