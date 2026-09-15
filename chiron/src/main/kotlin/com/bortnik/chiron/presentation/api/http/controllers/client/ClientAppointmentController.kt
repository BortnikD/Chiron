package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.appointment.CreateAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.GetAppointmentUseCase
import com.bortnik.chiron.application.usecase.appointment.UpdateAppointmentUseCase
import com.bortnik.chiron.application.usecase.service.GetServiceUseCase
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import com.bortnik.chiron.infrastructure.security.AuthenticatedUser
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.CancelAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.request.appointment.ClientCreateAppointmentRequest
import com.bortnik.chiron.presentation.api.http.dto.response.AppointmentResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import com.bortnik.chiron.presentation.api.http.mappers.toStatusUpdateDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
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
    private val createAppointmentUseCase: CreateAppointmentUseCase,
    private val getAppointmentUseCase: GetAppointmentUseCase,
    private val updateAppointmentUseCase: UpdateAppointmentUseCase,
    private val getServiceUseCase: GetServiceUseCase,
    private val accessGuard: ResourceAccessGuard,
) {
    @Operation(summary = "List appointments of own pets")
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @Parameter(description = "Return only appointments of this pet")
        @RequestParam(required = false) petId: UUID?,
    ): ApiResponse<List<AppointmentResponse>> {
        val appointments = if (petId != null) {
            accessGuard.requireOwnedPet(user.id, petId)
            getAppointmentUseCase.findAllByPetId(petId)
        } else {
            getAppointmentUseCase.findAllByOwnerId(user.id)
        }
        return ApiResponse.success(appointments.map { it.toResponse() })
    }

    @Operation(summary = "Get appointment of own pet by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
    ): ApiResponse<AppointmentResponse> =
        ApiResponse.success(accessGuard.requireOwnedAppointment(user.id, id).toResponse())

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
        @AuthenticationPrincipal user: AuthenticatedUser,
        @RequestBody request: ClientCreateAppointmentRequest,
    ): ResponseEntity<ApiResponse<AppointmentResponse>> {
        val pet = accessGuard.requireOwnedPet(user.id, request.petId)
        val price = getServiceUseCase.findPriceForSpecies(request.serviceId, pet.speciesId)
        return ApiResponse.created(createAppointmentUseCase.create(request.toDto(priceSnapshot = price)).toResponse())
    }

    @Operation(
        summary = "Cancel appointment of own pet",
        description = "Only PENDING and CONFIRMED appointments can be cancelled.",
    )
    @PostMapping("/{id}/cancel")
    fun cancel(
        @AuthenticationPrincipal user: AuthenticatedUser,
        @PathVariable id: UUID,
        @RequestBody(required = false) request: CancelAppointmentRequest?,
    ): ApiResponse<AppointmentResponse> {
        val appointment = accessGuard.requireOwnedAppointment(user.id, id)
        val dto = appointment.toStatusUpdateDto(AppointmentStatus.CANCELLED, user.id, request?.reason)
        return ApiResponse.success(updateAppointmentUseCase.update(id, dto).toResponse())
    }
}
