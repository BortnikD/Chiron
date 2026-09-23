package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.appointment.ClientBookAppointmentUseCase
import com.bortnik.chiron.application.usecase.client.appointment.ClientCancelAppointmentUseCase
import com.bortnik.chiron.application.usecase.client.appointment.ClientGetAppointmentUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CancelAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/client/appointments")
@Tag(name = "Client: Appointments")
class ClientAppointmentController(
    private val bookAppointmentUseCase: ClientBookAppointmentUseCase,
    private val getAppointmentUseCase: ClientGetAppointmentUseCase,
    private val cancelAppointmentUseCase: ClientCancelAppointmentUseCase,
) {
    @Operation(summary = "List appointments of own pets")
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @Parameter(description = "Return only appointments of this pet")
        @RequestParam(required = false) petId: UUID?,
    ): ApiResponse<List<AppointmentResponse>> =
        ApiResponse.success(getAppointmentUseCase.findAll(actor, petId).map { it.toResponse() })

    @Operation(summary = "Get appointment of own pet by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(getAppointmentUseCase.findById(actor, id).toResponse())

    @Operation(
        summary = "Book appointment for own pet",
        description = """
            The appointment is created as PENDING. The price is taken from the service, using the species-specific
            override when one exists. The pet must not be archived, the veterinarian must be active and permitted
            to treat the pet's species, the service must be active and available for the species,
            and the slot must be available.
        """,
    )
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: ClientCreateAppointmentRequest,
    ): ResponseEntity<ApiResponse<AppointmentResponse>> =
        ApiResponse.created(bookAppointmentUseCase.book(actor, request.toDto()).toResponse())

    @Operation(
        summary = "Cancel appointment of own pet",
        description = "Only PENDING and CONFIRMED appointments can be cancelled.",
    )
    @PostMapping("/{id}/cancel")
    fun cancel(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody(required = false) request: CancelAppointmentRequest?,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(cancelAppointmentUseCase.cancel(actor, id, request?.reason).toResponse())
}
