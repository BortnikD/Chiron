package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.vaccination.ClientGetVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/client/vaccinations")
@Tag(name = "Client: Vaccinations")
class ClientVaccinationController(private val getVaccinationUseCase: ClientGetVaccinationUseCase) {

    @Operation(summary = "List vaccinations of own pet")
    @GetMapping
    fun findAllByPetId(
        @AuthenticationPrincipal actor: Actor,
        @RequestParam petId: UUID,
    ): ApiResponse<List<VaccinationResponse>> =
        ApiResponse.success(getVaccinationUseCase.findAllByPetId(actor, petId).map { it.toResponse() })

    @Operation(summary = "Get vaccination of own pet by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(getVaccinationUseCase.findById(actor, id).toResponse())
}
