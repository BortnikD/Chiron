package com.bortnik.chiron.infrastructure.bootstrap

import com.bortnik.chiron.application.usecase.common.user.EnsureAdminAccountUseCase
import org.springframework.boot.CommandLineRunner
import org.springframework.stereotype.Component

// Runs on every startup; the use case creates the admin account only on the first one.
@Component
class AdminAccountInitializer(private val ensureAdminAccountUseCase: EnsureAdminAccountUseCase) : CommandLineRunner {

    override fun run(vararg args: String) = ensureAdminAccountUseCase.ensure()
}
