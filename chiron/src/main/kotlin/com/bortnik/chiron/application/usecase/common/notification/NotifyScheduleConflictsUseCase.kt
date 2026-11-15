package com.bortnik.chiron.application.usecase.common.notification

import com.bortnik.chiron.application.usecase.common.appointment.CheckAppointmentAvailabilityUseCase
import com.bortnik.chiron.domain.dto.appointment.AppointmentFilter
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.exceptions.notfound.VeterinarianNotFoundException
import com.bortnik.chiron.domain.repositories.AppointmentRepository
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

@Service
@Transactional
class NotifyScheduleConflictsUseCase(
    private val appointmentRepository: AppointmentRepository,
    private val veterinarianRepository: VeterinarianRepository,
    private val userRepository: UserRepository,
    private val checkAvailability: CheckAppointmentAvailabilityUseCase,
    private val notifyAppointment: NotifyAppointmentUseCase,
    private val clock: Clock,
) {
    fun conflictingIds(veterinarianId: UUID): Set<UUID> =
        conflictingAppointments(veterinarianId).map { it.id }.toSet()

    fun notifyNewConflicts(actorId: UUID, veterinarianId: UUID, previouslyConflictingIds: Set<UUID>) {
        val conflicts = conflictingAppointments(veterinarianId).filter { it.id !in previouslyConflictingIds }
        if (conflicts.isEmpty()) return

        val administratorIds = mutableSetOf<UUID>()
        var pageNumber = 0
        do {
            val page = userRepository.findAll(UserFilter(role = UserRole.ADMIN), PageRequest(pageNumber++, 100))
            administratorIds += page.items.map { it.id }
        } while (pageNumber < page.totalPages)

        // The initiating administrator also needs the warning; no appointment is changed automatically.
        conflicts.forEach { notifyAppointment.notifyScheduleConflict(actorId, it, administratorIds) }
    }

    private fun conflictingAppointments(veterinarianId: UUID): List<Appointment> {
        val veterinarian = veterinarianRepository.findById(veterinarianId)
            ?: throw VeterinarianNotFoundException(veterinarianId)
        val appointments = appointmentRepository.findAll(
            AppointmentFilter(
                veterinarianId = veterinarianId,
                statuses = setOf(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
                from = clock.instant(),
            ),
        )
        if (appointments.isEmpty()) return emptyList()
        if (!veterinarian.isActive) return appointments
        val availability = checkAvailability.availabilityOf(
            veterinarianId,
            appointments.minOf { it.startAt },
            appointments.maxOf { it.endAt },
        )
        return appointments.filter { availability.unavailabilityReason(it.startAt, it.endAt, it.id) != null }
    }
}
