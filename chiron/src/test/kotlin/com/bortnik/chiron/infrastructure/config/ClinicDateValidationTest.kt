package com.bortnik.chiron.infrastructure.config

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.usecase.common.pet.CreatePetUseCase
import com.bortnik.chiron.application.usecase.common.pet.UpdatePetUseCase
import com.bortnik.chiron.application.usecase.common.vaccination.CreateVaccinationUseCase
import com.bortnik.chiron.application.usecase.common.vaccination.UpdateVaccinationUseCase
import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.pet.CreatePetDto
import com.bortnik.chiron.domain.dto.pet.UpdatePetDto
import com.bortnik.chiron.domain.dto.vaccination.CreateVaccinationDto
import com.bortnik.chiron.domain.dto.vaccination.UpdateVaccinationDto
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.VaccinationRepository
import com.bortnik.chiron.presentation.api.http.dto.request.pet.ClientCreatePetRequest
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.CreateVaccinationRequest
import jakarta.validation.Validation
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ClinicDateValidationTest {
    private val config = ClockConfig()
    private val zone = config.clock(ClinicProperties("Europe/Moscow", 15)).zone
    private val now = Instant.parse("2026-11-07T21:30:00Z")
    private val clock = Clock.fixed(now, zone)
    private val today = LocalDate.parse("2026-11-08")
    private val petId = UUID.randomUUID()
    private val speciesId = UUID.randomUUID()
    private val createPet = CreatePetDto("Pet", UUID.randomUUID(), speciesId, birthDate = today, gender = Gender.MALE)
    private val updatePet = UpdatePetDto(birthDate = Patch.Value(today))
    private val createVaccination = CreateVaccinationDto(petId, name = "Vaccine", administeredOn = today)
    private val updateVaccination = UpdateVaccinationDto(administeredOn = today)

    @Test
    fun `request date constraints use the clinic day while utc is still on the previous day`() {
        assertEquals(ZoneId.of("Europe/Moscow"), zone)
        assertEquals(today.minusDays(1), LocalDate.now(clock.withZone(ZoneOffset.UTC)))
        val configuration = Validation.byDefaultProvider().configure()
        config.validationClock(clock).customize(configuration)
        configuration.buildValidatorFactory().use { factory ->
            for (date in listOf(today, today.plusDays(1))) {
                val requests = listOf(
                    ClientCreatePetRequest("Pet", speciesId, birthDate = date, gender = Gender.MALE),
                    CreateVaccinationRequest(petId, name = "Vaccine", administeredOn = date),
                )
                for (request in requests) {
                    val violations = factory.validator.validate(request)
                    assertEquals(if (date == today) 0 else 1, violations.size)
                }
            }
        }
    }

    @Test
    fun `pet and vaccination writes accept the clinic day and reject tomorrow`() {
        val pets = mock(PetRepository::class.java)
        val vaccinations = mock(VaccinationRepository::class.java)
        val appointments = mock(AppointmentRepository::class.java)
        val pet = Pet(
            petId, "Pet", createPet.ownerId, speciesId, birthDate = today, gender = Gender.MALE,
            createdAt = now, updatedAt = now,
        )
        val vaccination = Vaccination(UUID.randomUUID(), petId, name = "Vaccine", administeredOn = today)
        `when`(pets.create(createPet)).thenReturn(pet)
        `when`(pets.update(petId, updatePet)).thenReturn(pet)
        `when`(vaccinations.create(createVaccination)).thenReturn(vaccination)
        `when`(vaccinations.findById(vaccination.id)).thenReturn(vaccination)
        `when`(vaccinations.update(vaccination.id, updateVaccination)).thenReturn(vaccination)

        val petCreate = CreatePetUseCase(pets, clock)
        val petUpdate = UpdatePetUseCase(pets, clock)
        val vaccinationCreate = CreateVaccinationUseCase(vaccinations, appointments, clock)
        val vaccinationUpdate = UpdateVaccinationUseCase(vaccinations, clock)
        assertEquals(pet, petCreate.create(createPet))
        assertEquals(pet, petUpdate.update(petId, updatePet))
        assertEquals(vaccination, vaccinationCreate.create(createVaccination))
        assertEquals(vaccination, vaccinationUpdate.update(vaccination.id, updateVaccination))

        val tomorrow = today.plusDays(1)
        val invalidWrites = listOf<() -> Unit>(
            { petCreate.create(createPet.copy(birthDate = tomorrow)) },
            { petUpdate.update(petId, updatePet.copy(birthDate = Patch.Value(tomorrow))) },
            { vaccinationCreate.create(createVaccination.copy(administeredOn = tomorrow)) },
            { vaccinationUpdate.update(vaccination.id, updateVaccination.copy(administeredOn = tomorrow)) },
        )
        for (write in invalidWrites) {
            assertTrue(assertFailsWith<ValidationException> { write() }.errors.isNotEmpty())
        }
    }
}
