package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.notification.NotificationFilter
import com.bortnik.chiron.domain.entities.Notification
import com.bortnik.chiron.presentation.api.http.dto.request.notification.NotificationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.NotificationResponse

fun Notification.toResponse(): NotificationResponse = NotificationResponse(
    id = id,
    type = type,
    title = title,
    body = body,
    actorId = actorId,
    appointmentId = appointmentId,
    petId = petId,
    vaccinationId = vaccinationId,
    readAt = readAt,
    createdAt = createdAt,
)

fun NotificationFilterRequest.toDto(): NotificationFilter = NotificationFilter(unreadOnly = unreadOnly)
