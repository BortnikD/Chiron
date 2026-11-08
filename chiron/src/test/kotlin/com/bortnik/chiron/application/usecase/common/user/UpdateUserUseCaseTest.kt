package com.bortnik.chiron.application.usecase.common.user

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.user.UpdateProfileDto
import com.bortnik.chiron.domain.dto.user.UpdateUserDto
import com.bortnik.chiron.domain.exceptions.alreadyexists.UserAlreadyExistsException
import com.bortnik.chiron.domain.repositories.UserRepository
import com.bortnik.chiron.support.TestEntities.user
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when`
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class UpdateUserUseCaseTest {
    private val repository = mock(UserRepository::class.java)
    private val useCase = UpdateUserUseCase(repository)

    @Test
    fun `partial name changes rebuild full name from changed and retained parts`() {
        val existing = user.copy(middleName = "Sergeevich", fullName = "I. S. Petrov")
        `when`(repository.findById(user.id)).thenReturn(existing)
        val cases = listOf(
            UpdateProfileDto(lastName = "Sidorov") to UpdateUserDto(lastName = "Sidorov", fullName = "I. S. Sidorov"),
            UpdateProfileDto(firstName = "Pavel") to UpdateUserDto(firstName = "Pavel", fullName = "P. S. Petrov"),
            UpdateProfileDto(middleName = Patch.Value(null)) to UpdateUserDto(
                middleName = Patch.Value(null),
                fullName = "I. Petrov"
            ),
            UpdateProfileDto() to UpdateUserDto(),
        )
        for ((request, expected) in cases) {
            `when`(repository.update(user.id, expected)).thenReturn(existing)
            assertEquals(existing, useCase.update(user.id, request))
            verify(repository).update(user.id, expected)
        }
    }

    @Test
    fun `own email and phone are allowed without rewriting derived name`() {
        `when`(repository.findById(user.id)).thenReturn(user)
        `when`(repository.findByEmail(user.email)).thenReturn(user)
        `when`(repository.findByPhone(user.phone)).thenReturn(user)
        val expected = UpdateUserDto(email = user.email, phone = user.phone)
        `when`(repository.update(user.id, expected)).thenReturn(user)
        assertEquals(user, useCase.update(user.id, UpdateProfileDto(email = user.email, phone = user.phone)))
        verify(repository).update(user.id, expected)
    }

    @Test
    fun `email or phone belonging to another user prevents updating`() {
        `when`(repository.findById(user.id)).thenReturn(user)
        `when`(repository.findByEmail(user.email)).thenReturn(user.copy(id = UUID.randomUUID()))
        `when`(repository.findByPhone(user.phone)).thenReturn(user.copy(id = UUID.randomUUID()))
        assertFailsWith<UserAlreadyExistsException> { useCase.update(user.id, UpdateProfileDto(email = user.email)) }
        assertFailsWith<UserAlreadyExistsException> { useCase.update(user.id, UpdateProfileDto(phone = user.phone)) }
        verify(repository, times(2)).findById(user.id)
        verify(repository).findByEmail(user.email)
        verify(repository).findByPhone(user.phone)
        verifyNoMoreInteractions(repository)
    }
}
