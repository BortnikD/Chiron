package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.profile.VeterinarianGetProfileUseCase
import com.bortnik.chiron.application.usecase.veterinarian.profile.VeterinarianUpdateProfileUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.veterinarian.VeterinarianUpdateProfileRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/veterinarian/profile")
@Tag(name = "Veterinarian: Profile")
class VeterinarianProfileController(
    private val getProfileUseCase: VeterinarianGetProfileUseCase,
    private val updateProfileUseCase: VeterinarianUpdateProfileUseCase,
) {

    @Operation(summary = "Get own veterinarian profile")
    @GetMapping
    fun get(@AuthenticationPrincipal actor: Actor): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getProfileUseCase.get(actor).toResponse())

    @Operation(
        summary = "Update own veterinarian profile",
        description = "Only bio, photo and experience; specialization and activity are changed by an admin.",
    )
    @PatchMapping
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: VeterinarianUpdateProfileRequest,
    ): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(updateProfileUseCase.update(actor, request.toDto()).toResponse())
}
