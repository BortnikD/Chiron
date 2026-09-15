package com.bortnik.chiron.infrastructure.security

import com.bortnik.chiron.domain.entities.User
import com.bortnik.chiron.domain.entities.enums.UserRole
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import java.util.UUID

data class AuthenticatedUser(
    val id: UUID,
    val email: String,
    val firstName: String,
    val middleName: String?,
    val lastName: String,
    val fullName: String,
    val phone: String,
    val role: UserRole,
) {
    val authorities: List<GrantedAuthority>
        get() = listOf(SimpleGrantedAuthority("ROLE_${role.name}"))
}

fun User.toAuthenticatedUser(): AuthenticatedUser = AuthenticatedUser(
    id = id,
    email = email,
    firstName = firstName,
    middleName = middleName,
    lastName = lastName,
    fullName = fullName,
    phone = phone,
    role = role,
)
