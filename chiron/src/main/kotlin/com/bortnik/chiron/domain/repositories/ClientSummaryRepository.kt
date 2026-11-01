package com.bortnik.chiron.domain.repositories

import com.bortnik.chiron.domain.dto.client.ClientAppointmentTotalsDto
import com.bortnik.chiron.domain.dto.client.ClientVaccinationTotalsDto
import com.bortnik.chiron.domain.entities.Appointment
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

interface ClientSummaryRepository {
    fun countActivePets(ownerId: UUID): Long

    fun countAppointments(ownerId: UUID, now: Instant): ClientAppointmentTotalsDto

    fun findNextAppointment(ownerId: UUID, now: Instant): Appointment?

    fun countVaccinations(ownerId: UUID, today: LocalDate, dueTo: LocalDate): ClientVaccinationTotalsDto
}
