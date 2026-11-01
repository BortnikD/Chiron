package com.bortnik.chiron.application.usecase.admin.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.domain.dto.pagination.PageRequest
import com.bortnik.chiron.domain.dto.user.CreateUserDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.dto.user.UserFilter
import com.bortnik.chiron.domain.dto.veterinarian.CreateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.UpdateVeterinarianDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianDetailsDto
import com.bortnik.chiron.domain.dto.veterinarian.VeterinarianFilter
import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.Veterinarian
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.domain.repositories.VeterinarianRepository
import org.junit.jupiter.api.Test
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
        val calls = mutableListOf<String>()
        val users = object : UserRepository {
            override fun findById(id: UUID): User {
                assertEquals(user.id, id)
                calls += "load-user"
                return user
            }

            override fun create(dto: CreateUserDto): User = error("Unexpected call")
            override fun findByEmail(email: String): User? = error("Unexpected call")
            override fun findByPhone(phone: String): User? = error("Unexpected call")
            override fun findAll(filter: UserFilter, pageRequest: PageRequest) = error("Unexpected call")
            override fun update(id: UUID, dto: UpdateUserDto): User? = error("Unexpected call")
            override fun deleteById(id: UUID): Boolean = error("Unexpected call")
        }
        val veterinarians = object : VeterinarianRepository {
            override fun findByUserId(userId: UUID): Veterinarian? {
                assertEquals(user.id, userId)
                calls += "check-profile"
                return null
            }

            override fun create(dto: CreateVeterinarianDto): Veterinarian {
                assertEquals(user.id, dto.userId)
                calls += "insert-profile"
                return veterinarian
            }

            override fun findById(id: UUID): Veterinarian? = error("Unexpected call")
            override fun findAll(filter: VeterinarianFilter): List<Veterinarian> = error("Unexpected call")
            override fun findDetailsById(id: UUID): VeterinarianDetailsDto? = error("Unexpected call")
            override fun findDetailsByUserId(userId: UUID): VeterinarianDetailsDto? = error("Unexpected call")
            override fun findAllDetails(filter: VeterinarianFilter): List<VeterinarianDetailsDto> =
                error("Unexpected call")

            override fun update(id: UUID, dto: UpdateVeterinarianDto): Veterinarian? = error("Unexpected call")
            override fun deleteById(id: UUID): Boolean = error("Unexpected call")
        }
        val useCase = AdminCreateVeterinarianUseCase(veterinarians, users)

        val result = useCase.create(Actor(UUID.randomUUID(), UserRole.ADMIN, "Admin"), dto)

        assertEquals(listOf("load-user", "check-profile", "insert-profile"), calls)
        assertEquals(
            VeterinarianDetailsDto(veterinarian, user.firstName, user.middleName, user.lastName, user.fullName),
            result,
        )
    }
}
