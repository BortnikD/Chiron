package com.bortnik.chiron.presentation.api.http.controllers.client

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.client.vaccination.ClientGetVaccinationUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.vaccination.ClientVaccinationFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.response.VaccinationResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/client/vaccinations")
@Tag(name = "Client: Vaccinations")
class ClientVaccinationController(private val getVaccinationUseCase: ClientGetVaccinationUseCase) {

    @Operation(
        summary = "List vaccinations of own pets",
        description = "All filters are optional and combined with AND. Date bounds are inclusive and exclude " +
            "vaccinations without a next due date. Sorted by nextDueOn ascending, nulls last, then id ascending. " +
            "A pet owned by another user is rejected with 403.",
    )
    @GetMapping
    fun findAll(
        @AuthenticationPrincipal actor: Actor,
        @ParameterObject filter: ClientVaccinationFilterRequest,
    ): ApiResponse<List<VaccinationResponse>> =
        ApiResponse.success(getVaccinationUseCase.findAll(actor, filter.toDto()).map { it.toResponse() })

    @Operation(summary = "Get vaccination of own pet by id")
    @GetMapping("/{id}")
    fun findById(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
    ): ApiResponse<VaccinationResponse> =
        ApiResponse.success(getVaccinationUseCase.findById(actor, id).toResponse())
}
