package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.config.NotificationProperties
import com.bortnik.chiron.application.notification.NotificationMessages
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.dto.vaccination.VaccinationFilter
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.vaccination
import org.junit.jupiter.api.Test
import org.mockito.Mockito.CALLS_REAL_METHODS
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Duration
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

class SendVaccinationDueRemindersUseCaseTest {
    private val vaccinations = mock(VaccinationRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val create = mock(CreateNotificationUseCase::class.java)
    private val config = NotificationProperties(
        NotificationProperties.Reminder(Duration.ofHours(1)),
        NotificationProperties.VaccinationDue(7)
    )
    private val clinic = ClinicProperties("Europe/Moscow", 15)
    private val today = vaccination.nextDueOn!!
    private val filter = VaccinationFilter(nextDueFrom = today, nextDueTo = today.plusDays(7))
    private val useCase = SendVaccinationDueRemindersUseCase(vaccinations, pets, create, config, clinic)

    @Test
    fun `clinic date defines inclusive due window and duplicate reminders are not counted`() = withClinicDate {
        `when`(vaccinations.findAll(filter)).thenReturn(listOf(vaccination))
        `when`(pets.findById(pet.id)).thenReturn(pet)
        val text = NotificationMessages.forVaccinationDue(pet.name, vaccination.name, today)
        val dto = CreateNotificationDto(
            pet.ownerId, type = NotificationType.VACCINATION_DUE, title = text.title, body = text.body,
            petId = pet.id, vaccinationId = vaccination.id,
        )
        `when`(create.createIfAbsent(dto)).thenReturn(notification, null)
        assertEquals(1, useCase.send())
        assertEquals(0, useCase.send())
        verify(vaccinations, times(2)).findAll(filter)
        verify(create, times(2)).createIfAbsent(dto)
    }

    @Test
    fun `archived pets and missing due dates are skipped`() = withClinicDate {
        `when`(vaccinations.findAll(filter)).thenReturn(listOf(vaccination, vaccination.copy(nextDueOn = null)))
        `when`(pets.findById(pet.id)).thenReturn(pet.copy(isArchived = true))
        assertEquals(0, useCase.send())
        verifyNoInteractions(create)
    }

    @Test
    fun `later vaccination of the same name suppresses a reminder ignoring name case`() = withClinicDate {
        `when`(vaccinations.findAll(filter)).thenReturn(listOf(vaccination))
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findAllByPetId(pet.id)).thenReturn(
            listOf(
                vaccination,
                vaccination.copy(
                    id = UUID.randomUUID(),
                    name = "vAcCiNe",
                    administeredOn = vaccination.administeredOn.plusDays(1)
                ),
            )
        )
        assertEquals(0, useCase.send())
        verifyNoInteractions(create)
    }

    @Test
    fun `another vaccine or same day vaccination does not suppress a reminder`() = withClinicDate {
        `when`(vaccinations.findAll(filter)).thenReturn(listOf(vaccination))
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vaccinations.findAllByPetId(pet.id)).thenReturn(
            listOf(
                vaccination.copy(name = "Other vaccine", administeredOn = vaccination.administeredOn.plusDays(1)),
                vaccination.copy(id = UUID.randomUUID()),
            )
        )
        useCase.send()
        val text = NotificationMessages.forVaccinationDue(pet.name, vaccination.name, today)
        verify(create).createIfAbsent(
            CreateNotificationDto(
                pet.ownerId, type = NotificationType.VACCINATION_DUE, title = text.title, body = text.body,
                petId = pet.id, vaccinationId = vaccination.id,
            )
        )
    }

    private fun withClinicDate(block: () -> Unit) {
        mockStatic(LocalDate::class.java, CALLS_REAL_METHODS).use { dates ->
            dates.`when`<LocalDate> { LocalDate.now(clinic.zoneId) }.thenReturn(today)
            block()
        }
    }
}
