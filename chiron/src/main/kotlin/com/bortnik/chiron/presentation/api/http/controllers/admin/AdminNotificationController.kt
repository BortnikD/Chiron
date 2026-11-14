package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.notification.AdminSendMessageUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.notification.SendAdminMessageRequest
import com.bortnik.chiron.presentation.api.http.dto.response.NotificationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/notifications")
@Tag(name = "Admin: Notifications")
class AdminNotificationController(private val sendMessageUseCase: AdminSendMessageUseCase) {
    @Operation(
        summary = "Send an admin message to one user",
        description = "Stores an unread ADMIN_MESSAGE and delivers it through the notification channels after commit. " +
                "Optional appointmentId, petId and vaccinationId must exist and refer to the same pet. " +
                "Returns the created notification.",
    )
    @PostMapping("/users/{recipientId}")
    fun send(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable recipientId: UUID,
        @Valid @RequestBody request: SendAdminMessageRequest,
    ): ResponseEntity<ApiResponse<NotificationResponse>> =
        ApiResponse.created(sendMessageUseCase.send(actor, recipientId, request.toDto()).toResponse())
}
