package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.summary.ClientGetSummaryUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ClientSummaryResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/client/summary")
@Tag(name = "Client: Summary")
class ClientSummaryController(private val getSummaryUseCase: ClientGetSummaryUseCase) {

    @Operation(
        summary = "Get own dashboard summary",
        description = "Counts active pets, upcoming and completed appointments, current vaccination due dates " +
            "and unread notifications. Appointments include archived pets; vaccination counts exclude them. " +
            "vaccinationsDue includes overdue doses and doses due through the configured reminder lead days, " +
            "inclusive. Dates use the clinic time zone. nextAppointment is null when no future appointment exists.",
    )
    @GetMapping
    fun get(@AuthenticationPrincipal actor: Actor): ApiResponse<ClientSummaryResponse> =
        ApiResponse.success(getSummaryUseCase.get(actor).toResponse())
}
