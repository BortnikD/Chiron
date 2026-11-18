package com.bortnik.chiron.application.usecase.common.pet

import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.application.usecase.common.notification.CreateNotificationUseCase
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.utils.validators.PetValidator
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class UpdatePetUseCase(
    private val petRepository: PetRepository,
    private val clock: Clock,
    private val createNotification: CreateNotificationUseCase,
) {

    fun update(existing: Pet, dto: UpdatePetDto, actorId: UUID): Pet {
        PetValidator.validate(dto, LocalDate.now(clock))
        val updated = petRepository.update(existing.id, dto) ?: throw PetNotFoundException(existing.id)
        val type = when {
            existing.isArchived != updated.isArchived ->
                if (updated.isArchived) NotificationType.PET_ARCHIVED else NotificationType.PET_RESTORED

            actorId == updated.ownerId -> null
            existing.copy(updatedAt = updated.updatedAt, photoKey = updated.photoKey) != updated ->
                NotificationType.PET_UPDATED

            else -> null
        }
        if (type != null) {
            val text = NotificationMessages.forPetChange(type, updated.name)
            createNotification.create(
                CreateNotificationDto(
                    recipientId = updated.ownerId, actorId = actorId, type = type,
                    title = text.title, body = text.body, petId = updated.id,
                ),
            )
        }
        return updated
    }
}
