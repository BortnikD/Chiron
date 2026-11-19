package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.orElse
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.domain.entities.ServiceSpecies
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.exceptions.ValidationException
import com.bortnik.chiron.domain.exceptions.rules.AppointmentSlotUnavailableException
import com.bortnik.chiron.domain.exceptions.rules.InvalidAppointmentStatusTransitionException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianInactiveException
import com.bortnik.chiron.domain.exceptions.rules.VeterinarianNotPermittedForSpeciesException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.now
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.any
import org.mockito.Mockito.anyList
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class UpdateAppointmentUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val veterinarians = mock(VeterinarianRepository::class.java)
    private val permissions = mock(VeterinarianSpeciesPermissionRepository::class.java)
    private val availability = mock(CheckAppointmentAvailabilityUseCase::class.java)
    private val services = mock(ServiceRepository::class.java)
    private val overrides = mock(ServiceSpeciesRepository::class.java)
    private val extra = service.copy(
        id = UUID.randomUUID(), name = "Vaccination", basePrice = 50.0,
        baseDurationMin = 20, bufferAfterMin = 10
    )
    private var stored = appointment
    private val actorId = UUID.randomUUID()

    @BeforeEach
    fun prepare() {
        `when`(appointments.findByIdForUpdate(appointment.id)).thenAnswer { stored }
        `when`(appointments.findById(appointment.id)).thenAnswer { stored }
        `when`(
            appointments.update(
                eq(appointment.id) ?: appointment.id,
                any(UpdateAppointmentDto::class.java) ?: UpdateAppointmentDto()
            )
        )
            .thenAnswer { invocation ->
                val dto = invocation.getArgument<UpdateAppointmentDto>(1)
                stored = stored.copy(
                    veterinarianId = dto.veterinarianId ?: stored.veterinarianId,
                    startAt = dto.startAt ?: stored.startAt,
                    endAt = dto.endAt ?: stored.endAt,
                    status = dto.status ?: stored.status,
                    clientComment = dto.clientComment.orElse(stored.clientComment),
                    vetNotes = dto.vetNotes.orElse(stored.vetNotes),
                    cancelledBy = dto.cancelledBy.orElse(stored.cancelledBy),
                    cancelledAt = dto.cancelledAt.orElse(stored.cancelledAt),
                    cancelReason = dto.cancelReason.orElse(stored.cancelReason),
                )
                stored
            }
        `when`(appointments.replaceServices(eq(appointment.id) ?: appointment.id, anyList())).thenAnswer {
            stored = stored.copy(services = it.getArgument<List<AppointmentService>>(1))
            stored
        }
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(true)
        `when`(services.findAllByIds(anyList())).thenAnswer {
            val ids = it.getArgument<List<UUID>>(0)
            listOf(service, extra).filter { item -> item.id in ids }
        }
        `when`(overrides.findAllBySpeciesId(pet.speciesId)).thenReturn(
            listOf(service, extra).map { ServiceSpecies(it.id, pet.speciesId) },
        )
    }

    @Test
    fun `moving the whole interval and extending it recheck availability excluding the appointment itself`() {
        val moved = UpdateAppointmentDto(
            startAt = appointment.startAt.plusSeconds(900), endAt = appointment.endAt.plusSeconds(900),
        )
        useCase().update(appointment.id, moved, actorId)
        verify(availability).check(veterinarian.id, moved.startAt!!, moved.endAt!!, appointment.id)

        val extended = stored.endAt.plusSeconds(900)
        useCase().update(appointment.id, UpdateAppointmentDto(endAt = extended), actorId)
        verify(availability).check(veterinarian.id, stored.startAt, extended, appointment.id)
    }

    @Test
    fun `notes and unchanged schedule do not recheck availability`() {
        val result =
            useCase().update(appointment.id, UpdateAppointmentDto(vetNotes = Patch.Value("Updated notes")), actorId)
        assertEquals("Updated notes", result.vetNotes)
        verifyNoInteractions(availability)
    }

    @Test
    fun `inactive or unpermitted veterinarian prevents rescheduling`() {
        val dto = UpdateAppointmentDto(endAt = appointment.endAt.plusSeconds(900))
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian.copy(isActive = false))
        assertFailsWith<VeterinarianInactiveException> { useCase().update(appointment.id, dto, actorId) }
        `when`(veterinarians.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(permissions.exists(veterinarian.id, pet.speciesId)).thenReturn(false)
        assertFailsWith<VeterinarianNotPermittedForSpeciesException> { useCase().update(appointment.id, dto, actorId) }
        assertEquals(appointment, stored)
        verifyNoInteractions(availability)
    }

    @Test
    fun `terminal status cannot be reopened`() {
        stored = appointment.copy(status = AppointmentStatus.COMPLETED)
        assertFailsWith<InvalidAppointmentStatusTransitionException> {
            useCase().update(appointment.id, UpdateAppointmentDto(status = AppointmentStatus.CONFIRMED), actorId)
        }
        verifyNoInteractions(availability)
    }

    @Test
    fun `completion requires explicit performed services`() {
        assertFailsWith<ValidationException> {
            useCase(appointment.startAt.plusSeconds(60)).update(
                appointment.id, UpdateAppointmentDto(status = AppointmentStatus.COMPLETED), actorId,
            )
        }
        assertEquals(AppointmentStatus.CONFIRMED, stored.status)
    }

    @Test
    fun `completion can skip planned services and record a new performed service without changing time`() {
        val result = useCase(appointment.startAt.plusSeconds(60)).update(
            appointment.id,
            UpdateAppointmentDto(status = AppointmentStatus.COMPLETED, performedServiceIds = listOf(extra.id)),
            actorId,
        )
        assertEquals(AppointmentStatus.COMPLETED, result.status)
        assertEquals(false, result.services.single { it.serviceId == service.id }.isPerformed)
        val added = result.services.single { it.serviceId == extra.id }
        assertFalse(added.isPlanned)
        assertEquals(true, added.isPerformed)
        assertEquals(actorId, added.addedBy)
        assertEquals(100.0, result.estimatedTotal)
        assertEquals(50.0, result.actualTotal)
        assertEquals(appointment.endAt, result.endAt)
        verifyNoInteractions(availability)
    }

    @Test
    fun `after completion extra services and corrections preserve old snapshots and booked interval`() {
        stored = appointment.copy(
            status = AppointmentStatus.COMPLETED,
            services = appointment.services.map { it.copy(isPerformed = true, priceSnapshot = 80.0) })
        val result = useCase(appointment.endAt.plusSeconds(60)).update(
            appointment.id, UpdateAppointmentDto(performedServiceIds = listOf(service.id, extra.id)), actorId,
        )
        assertEquals(130.0, result.actualTotal)
        assertEquals(80.0, result.services.single { it.serviceId == service.id }.priceSnapshot)
        assertEquals(appointment.startAt, result.startAt)
        assertEquals(appointment.endAt, result.endAt)

        val corrected = useCase(appointment.endAt.plusSeconds(60)).update(
            appointment.id, UpdateAppointmentDto(performedServiceIds = listOf(service.id)), actorId,
        )
        assertEquals(80.0, corrected.actualTotal)
        assertEquals(false, corrected.services.single { it.serviceId == extra.id }.isPerformed)
        assertEquals(actorId, corrected.services.single { it.serviceId == extra.id }.updatedBy)
        verifyNoInteractions(availability)
    }

    @Test
    fun `recording a completed extra does not apply booking duration limits to medical facts`() {
        stored = appointment.copy(
            status = AppointmentStatus.COMPLETED,
            services = appointment.services.map { it.copy(isPerformed = true) })
        `when`(services.findAllByIds(listOf(extra.id))).thenReturn(listOf(extra.copy(baseDurationMin = 2000)))

        val result = useCase(appointment.endAt.plusSeconds(60)).update(
            appointment.id, UpdateAppointmentDto(performedServiceIds = listOf(service.id, extra.id)), actorId,
        )

        assertEquals(150.0, result.actualTotal)
        assertEquals(2000, result.services.single { it.serviceId == extra.id }.durationMinSnapshot)
        assertEquals(appointment.endAt, result.endAt)
        verifyNoInteractions(availability)
    }

    @Test
    fun `extension uses saved duration even if the current catalogue duration exceeds a day`() {
        `when`(services.findAllByIds(listOf(service.id))).thenReturn(listOf(service.copy(baseDurationMin = 2000)))
        val extended = appointment.endAt.plusSeconds(900)

        val result = useCase().update(appointment.id, UpdateAppointmentDto(endAt = extended), actorId)

        assertEquals(extended, result.endAt)
        assertEquals(30, result.durationMin)
        verify(availability).check(veterinarian.id, appointment.startAt, extended, appointment.id)
    }

    @Test
    fun `plan additions retain old snapshots and recalculate a longer continuous interval`() {
        stored = appointment.copy(services = appointment.services.map { it.copy(priceSnapshot = 80.0) })
        val result = useCase().update(
            appointment.id, UpdateAppointmentDto(serviceIds = listOf(service.id, extra.id)), actorId,
        )
        assertEquals(130.0, result.estimatedTotal)
        assertEquals(50, result.durationMin)
        assertEquals(15, result.bufferAfterMin)
        assertEquals(appointment.startAt.plusSeconds(65 * 60), result.endAt)
        assertTrue(result.services.all { it.isPlanned })
        verify(availability).check(veterinarian.id, result.startAt, result.endAt, appointment.id)
    }

    @Test
    fun `explicit legacy replan fills unknown duration snapshots and records author without repricing history`() {
        val changedAt = now.plusSeconds(120)
        stored = appointment.copy(services = appointment.services.map {
            it.copy(
                nameSnapshot = "Historical examination", priceSnapshot = 80.0,
                durationMinSnapshot = null, bufferAfterMinSnapshot = null
            )
        })

        val result = useCase(changedAt).update(
            appointment.id, UpdateAppointmentDto(serviceIds = listOf(service.id)), actorId,
        )

        val updated = result.services.single()
        assertEquals("Historical examination", updated.nameSnapshot)
        assertEquals(80.0, updated.priceSnapshot)
        assertEquals(30, updated.durationMinSnapshot)
        assertEquals(15, updated.bufferAfterMinSnapshot)
        assertEquals(actorId, updated.updatedBy)
        assertEquals(changedAt, updated.updatedAt)
        assertEquals(appointment.services.single().createdAt, updated.createdAt)
        assertEquals(appointment.endAt, result.endAt)
    }

    @Test
    fun `performed services cannot be recorded before the appointment starts or for invalid visit statuses`() {
        val dto = UpdateAppointmentDto(performedServiceIds = listOf(service.id))
        assertFailsWith<ValidationException> { useCase().update(appointment.id, dto, actorId) }
        for (status in listOf(AppointmentStatus.PENDING, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)) {
            stored = appointment.copy(status = status)
            assertFailsWith<ValidationException> {
                useCase(appointment.startAt.plusSeconds(60)).update(appointment.id, dto, actorId)
            }
        }
        verifyNoInteractions(availability)
    }

    @Test
    fun `cancelled and no-show statuses cannot hide services already recorded as performed`() {
        for (status in listOf(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)) {
            stored = appointment.copy(services = appointment.services.map { it.copy(isPerformed = true) })
            val dto = if (status == AppointmentStatus.CANCELLED) {
                UpdateAppointmentDto(
                    status = status,
                    cancelledBy = Patch.Value(actorId),
                    cancelledAt = Patch.Value(appointment.startAt.plusSeconds(60)),
                    cancelReason = Patch.Value("Unavailable")
                )
            } else UpdateAppointmentDto(status = status)

            assertFailsWith<ValidationException> {
                useCase(appointment.startAt.plusSeconds(60)).update(appointment.id, dto, actorId)
            }
            assertEquals(AppointmentStatus.CONFIRMED, stored.status)
            assertTrue(stored.services.all { it.isPerformed == true })
        }
        verifyNoInteractions(availability)
    }

    @Test
    fun `repeated cancellation preserves metadata loaded under the appointment lock`() {
        val originalActor = UUID.randomUUID()
        val originalTime = appointment.startAt.minusSeconds(60)
        stored = appointment.copy(
            status = AppointmentStatus.CANCELLED, cancelledBy = originalActor,
            cancelledAt = originalTime, cancelReason = "Original reason"
        )

        val result = useCase().update(
            appointment.id, UpdateAppointmentDto(
                status = AppointmentStatus.CANCELLED, cancelledBy = Patch.Value(actorId),
                cancelledAt = Patch.Value(now), cancelReason = Patch.Value("Stale request reason"),
            ), actorId
        )

        assertEquals(originalActor, result.cancelledBy)
        assertEquals(originalTime, result.cancelledAt)
        assertEquals("Original reason", result.cancelReason)
        verifyNoInteractions(availability)
    }

    @Test
    fun `conflicting extension leaves the saved interval unchanged`() {
        val end = appointment.endAt.plusSeconds(900)
        doThrow(AppointmentSlotUnavailableException(veterinarian.id, appointment.startAt, end, "Occupied"))
            .`when`(availability).check(veterinarian.id, appointment.startAt, end, appointment.id)

        assertFailsWith<AppointmentSlotUnavailableException> {
            useCase().update(appointment.id, UpdateAppointmentDto(endAt = end), actorId)
        }
        assertEquals(appointment, stored)
    }

    private fun useCase(at: Instant = now) = UpdateAppointmentUseCase(
        appointments, pets, veterinarians, permissions, availability,
        ResolveAppointmentServicesUseCase(services, overrides), Clock.fixed(at, ZoneOffset.UTC),
    )
}
