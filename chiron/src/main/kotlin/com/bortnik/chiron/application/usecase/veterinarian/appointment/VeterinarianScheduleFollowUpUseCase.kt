package com.bortnik.chiron.application.usecase.veterinarian.appointment

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.common.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.pet.GetPetUseCase
import com.bortnik.chiron.application.usecase.common.service.GetServiceUseCase
import com.bortnik.chiron.domain.dto.appointment.CreateAppointmentDto
import com.bortnik.chiron.domain.dto.appointment.ScheduleFollowUpDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class VeterinarianScheduleFollowUpUseCase(
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val getPetUseCase: GetPetUseCase,
    private val getServiceUseCase: GetServiceUseCase,
    private val accessGuard: ResourceAccessGuard,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    // The veterinarian picks the slot in their own schedule, so the follow-up is confirmed right away.
    // The price is frozen the same way as when a client books.
    fun schedule(actor: Actor, appointmentId: UUID, dto: ScheduleFollowUpDto): Appointment {
        val original = accessGuard.requireAssignedAppointment(actor, appointmentId)
        val serviceId = dto.serviceId ?: original.serviceId
        val pet = getPetUseCase.findById(original.petId)
        val appointment = createAppointmentUseCase.create(
            CreateAppointmentDto(
                veterinarianId = original.veterinarianId,
                petId = original.petId,
                serviceId = serviceId,
                followUpOf = original.id,
                startAt = dto.startAt,
                endAt = dto.endAt,
                status = AppointmentStatus.CONFIRMED,
                priceSnapshot = getServiceUseCase.findPriceForSpecies(serviceId, pet.speciesId),
            ),
        )
        log.info(
            "Veterinarian {} ({}) scheduled follow-up {} of appointment {} for pet {} at {}, price {}",
            actor.userId,
            actor.fullName,
            appointment.id,
            original.id,
            appointment.petId,
            appointment.startAt,
            appointment.priceSnapshot,
        )
        return appointment
    }
}
