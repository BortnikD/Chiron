package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.ResourceAccessGuard
import com.bortnik.chiron.application.usecase.veterinarian.GetVeterinarianUseCase
import com.bortnik.chiron.infrastructure.security.AuthenticatedUser
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.PetResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
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
    private val getVeterinarianUseCase: GetVeterinarianUseCase,
    private val accessGuard: ResourceAccessGuard,
) {
    @Operation(
        summary = "Get patient by id",
        description = "Available only for pets that have at least one appointment with the current veterinarian.",
    )
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal user: AuthenticatedUser, @PathVariable id: UUID): ApiResponse<PetResponse> {
        val veterinarian = getVeterinarianUseCase.findByUserId(user.id)
        return ApiResponse.success(accessGuard.requirePatient(veterinarian.id, id).toResponse())
    }
}
