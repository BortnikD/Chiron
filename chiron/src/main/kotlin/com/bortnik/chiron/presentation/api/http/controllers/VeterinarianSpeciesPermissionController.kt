package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.veterinarianspeciespermission.CreateVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.application.usecase.veterinarianspeciespermission.DeleteVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.application.usecase.veterinarianspeciespermission.GetVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianSpeciesPermissionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/veterinarians/{veterinarianId}/species")
@Tag(
    name = "Veterinarian species permissions",
    description = """
        Species a veterinarian is allowed to treat.
        Creating or rescheduling an appointment is rejected with VeterinarianNotPermittedForSpeciesException
        when the veterinarian has no permission for the pet's species.
    """,
)
class VeterinarianSpeciesPermissionController(
    private val createPermissionUseCase: CreateVeterinarianSpeciesPermissionUseCase,
    private val getPermissionUseCase: GetVeterinarianSpeciesPermissionUseCase,
    private val deletePermissionUseCase: DeleteVeterinarianSpeciesPermissionUseCase,
) {
    @Operation(summary = "List species the veterinarian may treat")
    @GetMapping
    fun findAllByVeterinarianId(
        @PathVariable veterinarianId: UUID,
    ): ApiResponse<List<VeterinarianSpeciesPermissionResponse>> =
        ApiResponse.success(getPermissionUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() })

    @Operation(summary = "Check whether the veterinarian may treat the species")
    @GetMapping("/{speciesId}/exists")
    fun exists(@PathVariable veterinarianId: UUID, @PathVariable speciesId: UUID): ApiResponse<Boolean> =
        ApiResponse.success(getPermissionUseCase.exists(veterinarianId, speciesId))

    @Operation(summary = "Grant permission to treat the species")
    @PostMapping("/{speciesId}")
    fun create(
        @PathVariable veterinarianId: UUID,
        @PathVariable speciesId: UUID,
    ): ResponseEntity<ApiResponse<VeterinarianSpeciesPermissionResponse>> {
        val permission = createPermissionUseCase.create(VeterinarianSpeciesPermission(veterinarianId, speciesId))
        return ApiResponse.created(permission.toResponse())
    }

    @Operation(summary = "Revoke permission to treat the species")
    @DeleteMapping("/{speciesId}")
    fun delete(@PathVariable veterinarianId: UUID, @PathVariable speciesId: UUID): ResponseEntity<Nothing> {
        deletePermissionUseCase.delete(veterinarianId, speciesId)
        return ApiResponse.noContent()
    }
}
