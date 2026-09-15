package com.bortnik.chiron.application.config

import org.springframework.boot.context.properties.ConfigurationProperties

// Credentials of the admin account created on startup; values come from the .env file.
@ConfigurationProperties(prefix = "admin")
data class AdminProperties(
    val email: String,
    val password: String,
    val phone: String,
    val firstName: String,
    val lastName: String,
)
