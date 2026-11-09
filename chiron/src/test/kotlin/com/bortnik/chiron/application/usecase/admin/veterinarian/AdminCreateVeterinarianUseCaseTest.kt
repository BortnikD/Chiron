package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.inOrder
import org.mockito.Mockito.mock
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals

class AdminCreateVeterinarianUseCaseTest {

    @Test
    fun `creation reuses the loaded user and does not read the inserted profile again`() {
        val now = Instant.parse("2026-11-01T10:00:00Z")
        val user = User(
            id = UUID.randomUUID(),
            email = "doctor@example.com",
            passwordHash = "hash",
            firstName = "Alexey",
            middleName = "Ivanovich",
            lastName = "Petrov",
            fullName = "A. I. Petrov",
            phone = "+79990000000",
            role = UserRole.VETERINARIAN,
            createdAt = now,
            updatedAt = now,
        )
        val dto = CreateVeterinarianDto(user.id, UUID.randomUUID(), experienceYears = 5)
        val veterinarian = Veterinarian(
            id = UUID.randomUUID(),
            userId = user.id,
            specializationId = dto.specializationId,
            experienceYears = dto.experienceYears,
            createdAt = now,
            updatedAt = now,
        )
        val users = mock(UserRepository::class.java)
        val veterinarians = mock(VeterinarianRepository::class.java)
        `when`(users.findById(user.id)).thenReturn(user)
        `when`(veterinarians.findByUserId(user.id)).thenReturn(null)
        `when`(veterinarians.create(dto)).thenReturn(veterinarian)
        val useCase = AdminCreateVeterinarianUseCase(veterinarians, users)

        val result = useCase.create(Actor(UUID.randomUUID(), UserRole.ADMIN, "Admin"), dto)

        val order = inOrder(users, veterinarians)
        order.verify(users).findById(user.id)
        order.verify(veterinarians).findByUserId(user.id)
        order.verify(veterinarians).create(dto)
        verifyNoMoreInteractions(users, veterinarians)
        assertEquals(
            VeterinarianDetailsDto(veterinarian, user.firstName, user.middleName, user.lastName, user.fullName),
            result,
        )
    }
}
