package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.notification.AppointmentNotificationDetails
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.application.notification.NotificationText
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.ServiceNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.utils.NotificationRules
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

// Runs inside the transaction of the change, so notifications are stored only if the change itself is.
@Service
@Transactional
class NotifyAppointmentUseCase(
    private val petRepository: PetRepository,
    private val serviceRepository: ServiceRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val userRepository: UserRepository,
    private val createNotificationUseCase: CreateNotificationUseCase,
    private val clinicProperties: ClinicProperties,
) {

    // before is null for a just created appointment; who gets what is decided by NotificationRules.
    fun notifyChange(actorId: UUID, before: Appointment?, after: Appointment) {
        val context = contextOf(after)
        val previousVeterinarianUserId = before?.veterinarianId
            ?.takeIf { it != after.veterinarianId }
            ?.let { findVeterinarianUserId(it) }
        val targets = NotificationRules.forAppointment(
            before = before,
            after = after,
            actorId = actorId,
            ownerId = context.ownerId,
            veterinarianUserId = context.veterinarianUserId,
            previousVeterinarianUserId = previousVeterinarianUserId,
        )
        for ((type, recipientIds) in targets) {
            val text = textOf(type, context)
            recipientIds.forEach { createNotificationUseCase.create(dtoOf(it, actorId, type, text, after)) }
        }
    }

    // Returns false when the owner has already been reminded of this appointment.
    fun remind(appointment: Appointment): Boolean {
        val context = contextOf(appointment)
        val type = NotificationType.APPOINTMENT_REMINDER
        val dto = dtoOf(context.ownerId, null, type, textOf(type, context), appointment)
        return createNotificationUseCase.createIfAbsent(dto) != null
    }

    private fun contextOf(appointment: Appointment): AppointmentContext {
        val pet = petRepository.findById(appointment.petId) ?: throw PetNotFoundException(appointment.petId)
        val service = serviceRepository.findById(appointment.serviceId)
            ?: throw ServiceNotFoundException(appointment.serviceId)
        val veterinarian = veterinarianRepository.findById(appointment.veterinarianId)
            ?: throw VeterinarianNotFoundException(appointment.veterinarianId)
        val veterinarianUser = userRepository.findById(veterinarian.userId)
            ?: throw UserNotFoundException(veterinarian.userId)
        return AppointmentContext(
            ownerId = pet.ownerId,
            veterinarianUserId = veterinarian.userId,
            details = AppointmentNotificationDetails(
                petName = pet.name,
                serviceName = service.name,
                veterinarianName = veterinarianUser.fullName,
                startAt = appointment.startAt,
                cancelReason = appointment.cancelReason,
            ),
        )
    }

    private fun findVeterinarianUserId(veterinarianId: UUID): UUID =
        veterinarianRepository.findById(veterinarianId)?.userId ?: throw VeterinarianNotFoundException(veterinarianId)

    private fun textOf(type: NotificationType, context: AppointmentContext): NotificationText =
        NotificationMessages.forAppointment(type, context.details, clinicProperties.zoneId)

    private fun dtoOf(
        recipientId: UUID,
        actorId: UUID?,
        type: NotificationType,
        text: NotificationText,
        appointment: Appointment,
    ) = CreateNotificationDto(
        recipientId = recipientId,
        actorId = actorId,
        type = type,
        title = text.title,
        body = text.body,
        appointmentId = appointment.id,
        petId = appointment.petId,
    )

    private data class AppointmentContext(
        val ownerId: UUID,
        val veterinarianUserId: UUID,
        val details: AppointmentNotificationDetails,
    )
}
