package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.exceptions.notfound.PetNotFoundException
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class SendVaccinationDueRemindersUseCase(
    private val vaccinationRepository: VaccinationRepository,
    private val petRepository: PetRepository,
    private val createNotificationUseCase: CreateNotificationUseCase,
    private val notificationProperties: NotificationProperties,
    private val clinicProperties: ClinicProperties,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    // Owners of non-archived pets are reminded once per vaccination whose next due date is within the lead days.
    // Returns how many reminders were sent.
    fun send(): Int {
        val today = LocalDate.now(clinicProperties.zoneId)
        val due = vaccinationRepository.findAll(
            VaccinationFilter(
                nextDueFrom = today,
                nextDueTo = today.plusDays(notificationProperties.vaccinationDue.leadDays),
            ),
        )
        val sent = due.count { remind(it) }
        if (sent > 0) log.info("Sent {} vaccination due reminders", sent)
        return sent
    }

    private fun remind(vaccination: Vaccination): Boolean {
        val dueOn = vaccination.nextDueOn ?: return false
        val pet = petRepository.findById(vaccination.petId) ?: throw PetNotFoundException(vaccination.petId)
        if (pet.isArchived || isRevaccinated(vaccination)) return false
        val text = NotificationMessages.forVaccinationDue(pet.name, vaccination.name, dueOn)
        val notification = createNotificationUseCase.createIfAbsent(
            CreateNotificationDto(
                recipientId = pet.ownerId,
                type = NotificationType.VACCINATION_DUE,
                title = text.title,
                body = text.body,
                petId = pet.id,
                vaccinationId = vaccination.id,
            ),
        )
        return notification != null
    }

    // A later vaccination with the same name means the pet has already been revaccinated ahead of the due date.
    private fun isRevaccinated(vaccination: Vaccination): Boolean =
        vaccinationRepository.findAllByPetId(vaccination.petId).any {
            it.name.equals(vaccination.name, ignoreCase = true) && it.administeredOn > vaccination.administeredOn
        }
}
