package com.bortnik.chiron.presentation.api.http.controllers

import com.bortnik.chiron.application.usecase.workschedule.CreateWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.workschedule.DeleteWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.workschedule.GetWorkScheduleUseCase
import com.bortnik.chiron.application.usecase.workschedule.UpdateWorkScheduleUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.CreateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.request.workschedule.UpdateWorkScheduleRequest
import com.bortnik.chiron.presentation.api.http.dto.response.WorkScheduleResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/work-schedules")
@Tag(
    name = "Work schedules",
    description = """
        Regular weekly working hours of a veterinarian: at most one entry per day of week, with an optional break.
        Days without an entry are days off. Schedule exceptions take precedence over these hours.
    """,
)
class WorkScheduleController(
    private val createWorkScheduleUseCase: CreateWorkScheduleUseCase,
    private val getWorkScheduleUseCase: GetWorkScheduleUseCase,
    private val updateWorkScheduleUseCase: UpdateWorkScheduleUseCase,
    private val deleteWorkScheduleUseCase: DeleteWorkScheduleUseCase,
) {
    @Operation(summary = "List weekly schedule of a veterinarian")
    @GetMapping
    fun findAllByVeterinarianId(@RequestParam veterinarianId: UUID): ApiResponse<List<WorkScheduleResponse>> =
        ApiResponse.success(getWorkScheduleUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() })

    @Operation(summary = "Get work schedule entry by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<WorkScheduleResponse> =
        ApiResponse.success(getWorkScheduleUseCase.findById(id).toResponse())

    @Operation(summary = "Create work schedule entry")
    @PostMapping
    fun create(@RequestBody request: CreateWorkScheduleRequest): ResponseEntity<ApiResponse<WorkScheduleResponse>> =
        ApiResponse.created(createWorkScheduleUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update work schedule entry")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateWorkScheduleRequest,
    ): ApiResponse<WorkScheduleResponse> =
        ApiResponse.success(updateWorkScheduleUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete work schedule entry")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteWorkScheduleUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
