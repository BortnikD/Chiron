package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.common.scheduleexception.GetScheduleExceptionUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ScheduleExceptionResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/schedule-exceptions")
@Tag(name = "Schedule exceptions")
class ScheduleExceptionController(private val getScheduleExceptionUseCase: GetScheduleExceptionUseCase) {

    @Operation(summary = "List schedule exceptions of a veterinarian")
    @GetMapping
    fun findAllByVeterinarianId(@RequestParam veterinarianId: UUID): ApiResponse<List<ScheduleExceptionResponse>> =
        ApiResponse.success(
            getScheduleExceptionUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() },
        )
}
