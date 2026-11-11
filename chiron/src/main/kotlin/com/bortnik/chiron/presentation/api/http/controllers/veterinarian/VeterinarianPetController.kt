package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.pet.VeterinarianGetPatientUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.pet.PetFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
import com.bortnik.chiron.presentation.api.http.mappers.PhotoResponseMapper
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarian/pets")
@Tag(name = "Veterinarian: Pets")
class VeterinarianPetController(
    private val getPatientUseCase: VeterinarianGetPatientUseCase,
    private val photoResponses: PhotoResponseMapper,
) {

    @Operation(
        summary = "List patients of the current veterinarian",
        description = """
            Pets with at least one appointment with the current veterinarian, regardless of appointment status or date.
            Each pet appears once. All filters are optional and combined with AND.
            Sorted by creation time ascending, then by id. totalElements counts all matching patients.
        """,
    )
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @Valid @ParameterObject filter: PetFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<PetResponse>> =
        ApiResponse.success(
            getPatientUseCase.findAll(actor, filter.toDto(), pagination.toDto()).toResponse { it.let(photoResponses::pet) },
        )

    @Operation(
        summary = "Get patient by id",
        description = "Available only for pets that have at least one appointment with the current veterinarian.",
    )
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<PetResponse> =
        ApiResponse.success(getPatientUseCase.findById(actor, id).let(photoResponses::pet))
}
