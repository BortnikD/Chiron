package com.bortnik.chiron.domain.dto.user

data class ChangePasswordDto(
    val currentPassword: String,
    val newPassword: String,
)
