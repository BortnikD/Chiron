package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.scheduleexception.GetScheduleExceptionUseCase
import com.bortnik.chiron.domain.dto.scheduleexception.ScheduleExceptionFilter
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ScheduleExceptionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v1/schedule-exceptions")
@Tag(name = "Schedule exceptions")
class ScheduleExceptionController(private val getScheduleExceptionUseCase: GetScheduleExceptionUseCase) {

    @Operation(summary = "List schedule exceptions of a veterinarian")
    @GetMapping
    fun findAll(
        @RequestParam veterinarianId: UUID,
        @Parameter(description = "Exceptions ending on or after this ISO-8601 date")
        @RequestParam(required = false) from: LocalDate?,
        @Parameter(description = "Exceptions starting on or before this ISO-8601 date")
        @RequestParam(required = false) to: LocalDate?,
    ): ApiResponse<List<ScheduleExceptionResponse>> {
        val filter = ScheduleExceptionFilter(veterinarianId = veterinarianId, from = from, to = to)
        return ApiResponse.success(getScheduleExceptionUseCase.findAll(filter).map { it.toResponse() })
    }
}
