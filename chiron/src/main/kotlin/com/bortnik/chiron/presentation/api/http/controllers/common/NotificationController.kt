package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.common.notification.GetOwnNotificationsUseCase
import com.bortnik.chiron.application.usecase.common.notification.MarkOwnNotificationsReadUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.notification.NotificationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.response.NotificationResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications")
class NotificationController(
    private val getOwnNotificationsUseCase: GetOwnNotificationsUseCase,
    private val markOwnNotificationsReadUseCase: MarkOwnNotificationsReadUseCase,
) {
    @Operation(
        summary = "List own notifications",
        description = """
            Available to every role; returns only the current user's notifications, newest first.
            New notifications are also pushed over STOMP: connect to /ws with the bearer token in the Authorization
            header of the CONNECT frame and subscribe to /user/queue/notifications.
        """,
    )
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @ParameterObject filter: NotificationFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<NotificationResponse>> =
        ApiResponse.success(
            getOwnNotificationsUseCase.findAll(actor, filter.toDto(), pagination.toDto()).toResponse { it.toResponse() },
        )

    @Operation(summary = "Count own unread notifications")
    @GetMapping("/unread-count")
    fun countUnread(@AuthenticationPrincipal actor: Actor): ApiResponse<Long> =
        ApiResponse.success(getOwnNotificationsUseCase.countUnread(actor))

    @Operation(
        summary = "Mark own notification as read",
        description = "An already read notification keeps its readAt. A notification of another user is not found.",
    )
    @PostMapping("/{id}/read")
    fun markRead(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<NotificationResponse> =
        ApiResponse.success(markOwnNotificationsReadUseCase.markRead(actor, id).toResponse())

    @Operation(
        summary = "Mark all own notifications as read",
        description = "Returns how many notifications were unread.",
    )
    @PostMapping("/read-all")
    fun markAllRead(@AuthenticationPrincipal actor: Actor): ApiResponse<Int> =
        ApiResponse.success(markOwnNotificationsReadUseCase.markAllRead(actor))
}
