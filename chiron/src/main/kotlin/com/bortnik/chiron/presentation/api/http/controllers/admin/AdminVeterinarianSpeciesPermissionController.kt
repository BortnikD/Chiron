package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.veterinarianspeciespermission.AdminCreateVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.application.usecase.admin.veterinarianspeciespermission.AdminDeleteVeterinarianSpeciesPermissionUseCase
import com.bortnik.chiron.domain.entities.VeterinarianSpeciesPermission
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianSpeciesPermissionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/veterinarians/{veterinarianId}/species")
@Tag(
    name = "Admin: Veterinarian species permissions",
    description = """
        Species a veterinarian is allowed to treat.
        Creating or rescheduling an appointment is rejected with VeterinarianNotPermittedForSpeciesException
        when the veterinarian has no permission for the pet's species.
    """,
)
class AdminVeterinarianSpeciesPermissionController(
    private val createPermissionUseCase: AdminCreateVeterinarianSpeciesPermissionUseCase,
    private val deletePermissionUseCase: AdminDeleteVeterinarianSpeciesPermissionUseCase,
) {
    @Operation(summary = "Grant permission to treat the species")
    @PostMapping("/{speciesId}")
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable veterinarianId: UUID,
        @PathVariable speciesId: UUID,
    ): ResponseEntity<ApiResponse<VeterinarianSpeciesPermissionResponse>> {
        val permission = createPermissionUseCase.create(actor, VeterinarianSpeciesPermission(veterinarianId, speciesId))
        return ApiResponse.created(permission.toResponse())
    }

    @Operation(summary = "Revoke permission to treat the species")
    @DeleteMapping("/{speciesId}")
    fun delete(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable veterinarianId: UUID,
        @PathVariable speciesId: UUID,
    ): ResponseEntity<Nothing> {
        deletePermissionUseCase.delete(actor, veterinarianId, speciesId)
        return ApiResponse.noContent()
    }
}
