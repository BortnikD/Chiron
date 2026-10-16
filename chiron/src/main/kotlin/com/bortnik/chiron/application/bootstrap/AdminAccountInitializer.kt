package com.bortnik.chiron.application.bootstrap

import com.bortnik.chiron.application.config.AdminProperties
import com.bortnik.chiron.application.usecase.common.user.RegisterUserUseCase
import com.bortnik.chiron.domain.dto.user.RegisterUserDto
import com.bortnik.chiron.domain.entities.enums.UserRole
import com.bortnik.chiron.domain.repositories.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

// Creates the admin account on the first startup; later startups leave an existing account untouched.
@Component
class AdminAccountInitializer(
    private val adminProperties: AdminProperties,
    private val userRepository: UserRepository,
    private val registerUserUseCase: RegisterUserUseCase,
) : CommandLineRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun run(vararg args: String) {
        val existing = userRepository.findByEmail(adminProperties.email)
        if (existing != null) {
            if (existing.role != UserRole.ADMIN) {
                log.warn("User {} already exists with role {}, admin account was not created", existing.email, existing.role)
            }
            return
        }

        val admin = registerUserUseCase.register(
            RegisterUserDto(
                email = adminProperties.email,
                password = adminProperties.password,
                firstName = adminProperties.firstName,
                lastName = adminProperties.lastName,
                phone = adminProperties.phone,
                role = UserRole.ADMIN,
            ),
        )
        log.info("Admin account {} created", admin.email)
    }
}
