package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.usecase.scheduleexception.CreateScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.scheduleexception.DeleteScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.scheduleexception.GetScheduleExceptionUseCase
import com.bortnik.chiron.application.usecase.scheduleexception.UpdateScheduleExceptionUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.CreateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.request.scheduleexception.UpdateScheduleExceptionRequest
import com.bortnik.chiron.presentation.api.http.dto.response.ScheduleExceptionResponse
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
    private val createScheduleExceptionUseCase: CreateScheduleExceptionUseCase,
    private val getScheduleExceptionUseCase: GetScheduleExceptionUseCase,
    private val updateScheduleExceptionUseCase: UpdateScheduleExceptionUseCase,
    private val deleteScheduleExceptionUseCase: DeleteScheduleExceptionUseCase,
) {
    @Operation(summary = "Get schedule exception by id")
    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID): ApiResponse<ScheduleExceptionResponse> =
        ApiResponse.success(getScheduleExceptionUseCase.findById(id).toResponse())

    @Operation(summary = "Create schedule exception")
    @PostMapping
    fun create(
        @RequestBody request: CreateScheduleExceptionRequest,
    ): ResponseEntity<ApiResponse<ScheduleExceptionResponse>> =
        ApiResponse.created(createScheduleExceptionUseCase.create(request.toDto()).toResponse())

    @Operation(summary = "Update schedule exception")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateScheduleExceptionRequest,
    ): ApiResponse<ScheduleExceptionResponse> =
        ApiResponse.success(updateScheduleExceptionUseCase.update(id, request.toDto()).toResponse())

    @Operation(summary = "Delete schedule exception")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Nothing> {
        deleteScheduleExceptionUseCase.delete(id)
        return ApiResponse.noContent()
    }
}
