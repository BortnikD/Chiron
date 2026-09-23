package com.bortnik.chiron.application.usecase.client.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.domain.dto.appointment.BookAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ClientBookAppointmentUseCase(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val getServiceUseCase: GetServiceUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    // The price is frozen at booking time, using the species-specific override when one exists.
    fun book(actor: Actor, dto: BookAppointmentDto): Appointment {
        val pet = accessGuard.requireOwnedPet(actor, dto.petId)
        val price = getServiceUseCase.findPriceForSpecies(dto.serviceId, pet.speciesId)
        val appointment = createAppointmentUseCase.create(
            CreateAppointmentDto(
                veterinarianId = dto.veterinarianId,
                petId = dto.petId,
                serviceId = dto.serviceId,
                startAt = dto.startAt,
                endAt = dto.endAt,
                priceSnapshot = price,
                clientComment = dto.clientComment,
            ),
        )
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
