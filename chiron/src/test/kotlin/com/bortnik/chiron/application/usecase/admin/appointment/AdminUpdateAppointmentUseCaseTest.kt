package com.bortnik.chiron.application.usecase.admin.appointment

import com.bortnik.chiron.application.config.ClinicProperties
import com.bortnik.chiron.application.notification.NotificationCreatedEvent
import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.application.usecase.common.appointment.GetAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.application.usecase.common.appointment.ResolveAppointmentServicesUseCase
import com.bortnik.chiron.application.usecase.common.notification.CreateNotificationUseCase
import com.bortnik.chiron.application.usecase.common.notification.NotifyAppointmentUseCase
import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.dto.notification.CreateNotificationDto
import com.bortnik.chiron.domain.entities.AppointmentService
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.NotificationRepository
import com.bortnik.chiron.domain.repositories.PetRepository
import com.bortnik.chiron.domain.repositories.ServiceRepository
import com.bortnik.chiron.domain.repositories.ServiceSpeciesRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import com.bortnik.chiron.domain.repositories.VeterinarianSpeciesPermissionRepository
import com.bortnik.chiron.support.TestEntities.appointment
import com.bortnik.chiron.support.TestEntities.notification
import com.bortnik.chiron.support.TestEntities.pet
import com.bortnik.chiron.support.TestEntities.service
import com.bortnik.chiron.support.TestEntities.user
import com.bortnik.chiron.support.TestEntities.veterinarian
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito.any
import org.mockito.Mockito.anyList
import org.mockito.Mockito.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import org.springframework.context.ApplicationEventPublisher
import java.util.UUID
import java.time.Clock
import java.time.ZoneOffset
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class AdminUpdateAppointmentUseCaseTest {
    private val appointments = mock(AppointmentRepository::class.java)
    private val pets = mock(PetRepository::class.java)
    private val services = mock(ServiceRepository::class.java)
    private val users = mock(UserRepository::class.java)
    private val vets = mock(VeterinarianRepository::class.java)
    private val notifications = mock(NotificationRepository::class.java)
    private val publisher = mock(ApplicationEventPublisher::class.java)
    private val fallback = UpdateAppointmentDto()
    private val notificationFallback =
        CreateNotificationDto(pet.ownerId, type = notification.type, title = "Title", body = "Body")
    private val actor = Actor(UUID.randomUUID(), UserRole.ADMIN, "Admin")
    private var stored = appointment
    private val useCase = AdminUpdateAppointmentUseCase(
        GetAppointmentUseCase(appointments),
        UpdateAppointmentUseCase(
            appointments, pets, vets, mock(VeterinarianSpeciesPermissionRepository::class.java),
            mock(CheckAppointmentAvailabilityUseCase::class.java),
            ResolveAppointmentServicesUseCase(services, mock(ServiceSpeciesRepository::class.java)),
            Clock.fixed(appointment.startAt.plusSeconds(60), ZoneOffset.UTC),
        ),
        NotifyAppointmentUseCase(
            pets,
            vets,
            users,
            CreateNotificationUseCase(notifications, publisher),
            ClinicProperties("Europe/Moscow", 15),
        ),
    )

    @BeforeEach
    fun prepare() {
        `when`(appointments.findById(appointment.id)).thenAnswer { stored }
        `when`(appointments.findByIdForUpdate(appointment.id)).thenAnswer { stored }
        `when`(appointments.replaceServices(eq(appointment.id) ?: appointment.id, anyList())).thenAnswer {
            stored = stored.copy(services = it.getArgument<List<AppointmentService>>(1))
            stored
        }
        `when`(
            appointments.update(
                eq(appointment.id) ?: appointment.id,
                any(UpdateAppointmentDto::class.java) ?: fallback
            )
        )
            .thenAnswer { invocation ->
                val dto = invocation.getArgument<UpdateAppointmentDto>(1)
                stored = stored.copy(
                    status = dto.status ?: appointment.status,
                    vetNotes = if (dto.vetNotes is Patch.Value) dto.vetNotes.value else appointment.vetNotes,
                    cancelledBy = if (dto.cancelledBy is Patch.Value) dto.cancelledBy.value else null,
                    cancelledAt = if (dto.cancelledAt is Patch.Value) dto.cancelledAt.value else null,
                    cancelReason = if (dto.cancelReason is Patch.Value) dto.cancelReason.value else null,
                )
                stored
            }
        `when`(pets.findById(pet.id)).thenReturn(pet)
        `when`(vets.findById(veterinarian.id)).thenReturn(veterinarian)
        `when`(users.findById(user.id)).thenReturn(user)
        `when`(notifications.create(any(CreateNotificationDto::class.java) ?: notificationFallback)).thenReturn(
            notification
        )
    }

    @Test
    fun `cancellation fills metadata and stores notifications for both parties`() {
        val result = useCase.update(
            actor,
            appointment.id,
            UpdateAppointmentDto(status = AppointmentStatus.CANCELLED, cancelReason = Patch.Value("Unavailable")),
        )
        assertEquals(actor.userId, result.cancelledBy)
        assertNotNull(result.cancelledAt)
        assertEquals("Unavailable", result.cancelReason)
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(notifications, times(2)).create(captor.capture() ?: notificationFallback)
        assertEquals(setOf(pet.ownerId, user.id), captor.allValues.map { it.recipientId }.toSet())
        assertEquals(setOf(NotificationType.APPOINTMENT_CANCELLED), captor.allValues.map { it.type }.toSet())
        verify(publisher, times(2)).publishEvent(NotificationCreatedEvent(notification))
    }

    @Test
    fun `completion with notes reaches stored notifications through real shared use cases`() {
        `when`(services.findAllByIds(listOf(service.id))).thenReturn(listOf(service))
        val result = useCase.update(
            actor,
            appointment.id,
            UpdateAppointmentDto(
                status = AppointmentStatus.COMPLETED, vetNotes = Patch.Value("Results"),
                performedServiceIds = listOf(service.id)
            ),
        )
        assertEquals(AppointmentStatus.COMPLETED, result.status)
        val captor = ArgumentCaptor.forClass(CreateNotificationDto::class.java)
        verify(notifications, times(2)).create(captor.capture() ?: notificationFallback)
        assertEquals(
            setOf(NotificationType.APPOINTMENT_COMPLETED, NotificationType.APPOINTMENT_NOTES_UPDATED),
            captor.allValues.map { it.type }.toSet(),
        )
        assertEquals(setOf(pet.ownerId), captor.allValues.map { it.recipientId }.toSet())
    }
}
