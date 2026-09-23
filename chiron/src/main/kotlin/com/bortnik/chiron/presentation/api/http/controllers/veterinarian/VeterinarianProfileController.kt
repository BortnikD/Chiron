package com.bortnik.chiron.presentation.api.http.controllers.veterinarian

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.veterinarian.profile.VeterinarianGetProfileUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/veterinarian/profile")
@Tag(name = "Veterinarian: Profile")
class VeterinarianProfileController(private val getProfileUseCase: VeterinarianGetProfileUseCase) {

    @Operation(summary = "Get own veterinarian profile")
    @GetMapping
    fun get(@AuthenticationPrincipal actor: Actor): ApiResponse<VeterinarianResponse> =
        ApiResponse.success(getProfileUseCase.get(actor).toResponse())
}
