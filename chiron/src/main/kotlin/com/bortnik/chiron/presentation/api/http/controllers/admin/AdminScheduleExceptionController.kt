package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.security.Actor
import com.bortnik.chiron.application.usecase.admin.scheduleexception.AdminCreateScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.admin.scheduleexception.AdminDeleteScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.admin.scheduleexception.AdminGetScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.admin.scheduleexception.AdminUpdateScheduleExceptionUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.pagination.PaginationRequest
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.CreateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.ScheduleExceptionFilterRequest
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.UpdateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.response.PageResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ScheduleExceptionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toDto
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/schedule-exceptions")
@Tag(
    name = "Admin: Schedule exceptions",
    description = """
        Deviations from a veterinarian's weekly work schedule for an inclusive date range.
        ABSENCE: the veterinarian is unavailable on every date of the range; startTime and endTime must be empty.
        CUSTOM_HOURS: startTime and endTime replace the weekly hours on those dates and are required;
        the weekly break is not applied on such dates.
    """,
)
class AdminScheduleExceptionController(
    private val createScheduleExceptionUseCase: AdminCreateScheduleExceptionUseCase,
    private val getScheduleExceptionUseCase: AdminGetScheduleExceptionUseCase,
    private val updateScheduleExceptionUseCase: AdminUpdateScheduleExceptionUseCase,
    private val deleteScheduleExceptionUseCase: AdminDeleteScheduleExceptionUseCase,
) {
    @Operation(
        summary = "List schedule exceptions",
        description = "All filters are optional and combined with AND. Sorted by start date ascending.",
    )
    @GetMapping
    fun findAll(
        @Valid @ParameterObject filter: ScheduleExceptionFilterRequest,
        @Valid @ParameterObject pagination: PaginationRequest,
    ): ApiResponse<PageResponse<ScheduleExceptionResponse>> =
        ApiResponse.success(
            getScheduleExceptionUseCase.findAll(filter.toDto(), pagination.toDto())
                .toResponse { it.toResponse() },
        )

    @Operation(summary = "Get schedule exception by id")
    @GetMapping("/{id}")
    fun findById(
        @PathVariable id: UUID,
    ): ApiResponse<ScheduleExceptionResponse> =
        ApiResponse.success(getScheduleExceptionUseCase.findById(id).toResponse())

    @Operation(summary = "Create schedule exception")
    @PostMapping
    fun create(
        @AuthenticationPrincipal actor: Actor,
        @Valid @RequestBody request: CreateScheduleExceptionRequest,
    ): ResponseEntity<ApiResponse<ScheduleExceptionResponse>> =
        ApiResponse.created(createScheduleExceptionUseCase.create(actor, request.toDto()).toResponse())

    @Operation(summary = "Update schedule exception")
    @PatchMapping("/{id}")
    fun update(
        @AuthenticationPrincipal actor: Actor,
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateScheduleExceptionRequest,
    ): ApiResponse<ScheduleExceptionResponse> =
        ApiResponse.success(updateScheduleExceptionUseCase.update(actor, id, request.toDto()).toResponse())

    @Operation(summary = "Delete schedule exception")
    @DeleteMapping("/{id}")
    fun delete(@AuthenticationPrincipal actor: Actor, @PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteScheduleExceptionUseCase.delete(actor, id)
        return ApiResponse.noContent()
    }
}
