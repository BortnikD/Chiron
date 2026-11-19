package com.bortnik.chiron.application.usecase.admin.notification

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.CreateNotificationUseCase
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.notification.SendAdminMessageDto
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.AccessDeniedException
import com.bortnik.chiron.domain.exceptions.notfound.AppointmentNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.UserNotFoundException
import com.bortnik.chiron.domain.exceptions.notfound.VaccinationNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.domain.utils.validators.AdminMessageValidator
import com.bortnik.chiron.domain.utils.validators.validateBusinessRules
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AdminSendMessageUseCase(
    private val userRepository: UserRepository,
    private val appointmentRepository: AppointmentRepository,
    private val petRepository: PetRepository,
    private val vaccinationRepository: VaccinationRepository,
    private val createNotificationUseCase: CreateNotificationUseCase,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun send(actor: Actor, recipientId: UUID, dto: SendAdminMessageDto): Notification {
        if (actor.role != UserRole.ADMIN) throw AccessDeniedException("Only admins can send messages")
        AdminMessageValidator.validate(dto)
        val appointment = dto.appointmentId?.let {
            appointmentRepository.findById(it) ?: throw AppointmentNotFoundException(it)
        }
        val pet = dto.petId?.let { petRepository.findById(it) ?: throw PetNotFoundException(it) }
        val vaccination = dto.vaccinationId?.let {
            vaccinationRepository.findById(it) ?: throw VaccinationNotFoundException(it)
        }
        validateBusinessRules {
            ensure(
                listOfNotNull(pet?.id, appointment?.petId, vaccination?.petId).distinct().size <= 1,
                "petId",
                "linked appointment, pet and vaccination must refer to the same pet",
            )
        }
        userRepository.findById(recipientId) ?: throw UserNotFoundException(recipientId)
        val notification = createNotificationUseCase.create(
            CreateNotificationDto(
                recipientId = recipientId,
                actorId = actor.userId,
                type = NotificationType.ADMIN_MESSAGE,
                title = dto.title,
                body = dto.body,
                appointmentId = dto.appointmentId,
                petId = dto.petId,
                vaccinationId = dto.vaccinationId,
            ),
        )
        log.info("Admin {} ({}) sent a message to user {}", actor.userId, actor.fullName, recipientId)
        return notification
    }
}
