package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.notification.AppointmentNotificationDetails
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.application.notification.NotificationText
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
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
    private val veterinarianRepository: VeterinarianRepository,
    private val userRepository: UserRepository,
    private val createNotificationUseCase: CreateNotificationUseCase,
    private val clinicProperties: ClinicProperties,
) {

    // before is null for a just created appointment; who gets what is decided by NotificationRules.
    fun notifyChange(actor: Actor, before: Appointment?, after: Appointment) {
        val actorId = actor.userId
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
        if (actor.role == UserRole.CLIENT && (before == null ||
                    (before.status != after.status && after.status == AppointmentStatus.CANCELLED))
        ) {
            val type =
                if (before == null) NotificationType.APPOINTMENT_BOOKED else NotificationType.APPOINTMENT_CANCELLED
            val text = textOf(type, context)
            createNotificationUseCase.createAll(
                userRepository.findAdministratorIds().map { dtoOf(it, actorId, type, text, after) },
            )
        }
    }

    fun notifyScheduleConflict(actorId: UUID, appointment: Appointment, administratorIds: Set<UUID>) {
        val context = contextOf(appointment)
        val type = NotificationType.SCHEDULE_CONFLICT
        val text = textOf(type, context)
        administratorIds.forEach { createNotificationUseCase.create(dtoOf(it, actorId, type, text, appointment)) }
    }

    // Returns false when the owner has already been reminded of this start time.
    fun remind(appointment: Appointment): Boolean {
        val context = contextOf(appointment)
        val type = NotificationType.APPOINTMENT_REMINDER
        val dto = dtoOf(context.ownerId, null, type, textOf(type, context), appointment)
            .copy(reminderStartAt = appointment.startAt)
        return createNotificationUseCase.createIfAbsent(dto) != null
    }

    private fun contextOf(appointment: Appointment): AppointmentContext {
        val pet = petRepository.findById(appointment.petId) ?: throw PetNotFoundException(appointment.petId)
        val services = appointment.services.filter {
            if (appointment.status == AppointmentStatus.COMPLETED) it.isPerformed == true
            else it.isPlanned || it.isPerformed == true
        }
        val serviceNames = NotificationMessages.appointmentServiceNames(services.map { it.nameSnapshot })
        val veterinarian = veterinarianRepository.findById(appointment.veterinarianId)
            ?: throw VeterinarianNotFoundException(appointment.veterinarianId)
        val veterinarianUser = userRepository.findById(veterinarian.userId)
            ?: throw UserNotFoundException(veterinarian.userId)
        return AppointmentContext(
            ownerId = pet.ownerId,
            veterinarianUserId = veterinarian.userId,
            details = AppointmentNotificationDetails(
                petName = pet.name,
                serviceName = serviceNames,
                veterinarianName = veterinarianUser.fullName,
                startAt = appointment.startAt,
                cancelReason = appointment.cancelReason,
                status = appointment.status,
                estimatedTotal = appointment.estimatedTotal,
                actualTotal = appointment.actualTotal,
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
