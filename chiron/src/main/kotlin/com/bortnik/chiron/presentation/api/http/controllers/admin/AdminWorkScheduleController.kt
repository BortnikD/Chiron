package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.workschedule.AdminCreateWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.admin.workschedule.AdminDeleteWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.admin.workschedule.AdminGetWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.admin.workschedule.AdminUpdateWorkScheduleUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.CreateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.UpdateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.response.WorkScheduleResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/work-schedules")
@Tag(
    name = "Admin: Work schedules",
    description = """
        Regular weekly working hours of a veterinarian: at most one entry per day of week, with an optional break.
        Days without an entry are days off. Schedule exceptions take precedence over these hours.
    """,
)
class AdminWorkScheduleController(
    private val createWorkScheduleUseCase: AdminCreateWorkScheduleUseCase,
    private val getWorkScheduleUseCase: AdminGetWorkScheduleUseCase,
    private val updateWorkScheduleUseCase: AdminUpdateWorkScheduleUseCase,
    private val deleteWorkScheduleUseCase: AdminDeleteWorkScheduleUseCase,
) {
    @Operation(summary = "Get work schedule entry by id")
    @GetMapping("/{id}")
    fun findById(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ApiResponse<WorkScheduleResponse> =
        ApiResponse.success(getWorkScheduleUseCase.findById(actor, id).toResponse())

    @Operation(summary = "Create work schedule entry")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @RequestBody request: CreateWorkScheduleRequest,
    ): ResponseEntity<ApiResponse<WorkScheduleResponse>> =
        ApiResponse.created(createWorkScheduleUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update work schedule entry")
    @PutMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @RequestBody request: UpdateWorkScheduleRequest,
    ): ApiResponse<WorkScheduleResponse> =
        ApiResponse.success(updateWorkScheduleUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete work schedule entry")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteWorkScheduleUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
