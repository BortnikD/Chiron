package com.bortnik.chiron.support

import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.domain.entities.Pet
import com.bortnik.chiron.domain.entities.Service
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.Vaccination
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.domain.entities.enums.Gender
import com.bortnik.chiron.domain.entities.enums.NotificationType
import com.bortnik.chiron.domain.entities.enums.UserRole
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

object TestEntities {
    val now: Instant = Instant.parse("2026-11-08T09:00:00Z")
    val user = User(
        UUID(0, 1), "vet@example.com", "hash", "Ivan", lastName = "Petrov", fullName = "I. Petrov",
        phone = "+79990000001", role = UserRole.VETERINARIAN, createdAt = now, updatedAt = now,
    )
    val veterinarian = Veterinarian(
        UUID(0, 2), user.id, UUID(0, 3), experienceYears = 5, createdAt = now, updatedAt = now,
    )
    val pet = Pet(
        UUID(0, 4), "Pet", UUID(0, 5), UUID(0, 6), gender = Gender.MALE, createdAt = now, updatedAt = now,
    )
    val service = Service(
        UUID(0, 7), veterinarian.specializationId, "Visit", "Examination", 100.0, 30,
        bufferAfterMin = 15, createdAt = now, updatedAt = now,
    )
    val appointment = Appointment(
        UUID(0, 8), veterinarian.id, pet.id, service.id, startAt = now.plusSeconds(3600),
        endAt = now.plusSeconds(6300), status = AppointmentStatus.CONFIRMED, priceSnapshot = 100.0,
        createdAt = now, updatedAt = now,
    )
    val vaccination = Vaccination(
        UUID(0, 9), pet.id, name = "Vaccine", administeredOn = LocalDate.of(2025, 11, 8),
        nextDueOn = LocalDate.of(2026, 11, 8),
    )
    val notification = Notification(
        UUID(0, 10), pet.ownerId, type = NotificationType.APPOINTMENT_REMINDER,
        title = "Reminder", body = "Visit reminder", appointmentId = appointment.id, petId = pet.id, createdAt = now,
    )
}
