package com.bortnik.chiron.presentation.api.http.dto.request.notification

import io.swagger.v3.oas.annotations.Parameter

data class NotificationFilterRequest(
    @field:Parameter(description = "Return only unread notifications")
    val unreadOnly: Boolean = false,
)
