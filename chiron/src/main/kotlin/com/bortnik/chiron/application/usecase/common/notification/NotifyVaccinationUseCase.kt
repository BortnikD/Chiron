package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class NotifyVaccinationUseCase(
    private val petRepository: PetRepository,
    private val createNotification: CreateNotificationUseCase,
) {
    fun notifyChange(actorId: UUID, before: Vaccination?, after: Vaccination) {
        if (before == after) return
        val type = if (before == null) NotificationType.VACCINATION_CREATED else NotificationType.VACCINATION_UPDATED
        notify(actorId, after, type)
    }

    fun notifyDeletion(actorId: UUID, vaccination: Vaccination) =
        notify(actorId, vaccination, NotificationType.VACCINATION_DELETED)

    private fun notify(actorId: UUID, vaccination: Vaccination, type: NotificationType) {
        val pet = petRepository.findById(vaccination.petId) ?: throw PetNotFoundException(vaccination.petId)
        val text = NotificationMessages.forVaccinationChange(type, pet.name, vaccination)
        createNotification.create(
            CreateNotificationDto(
                recipientId = pet.ownerId,
                actorId = actorId,
                type = type,
                title = text.title,
                body = text.body,
                petId = pet.id,
                vaccinationId = vaccination.id,
            ),
        )
    }
}
