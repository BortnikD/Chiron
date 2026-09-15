package com.bortnik.chiron.presentation.api.http.controllers.common

import com.bortnik.chiron.application.usecase.workschedule.GetWorkScheduleUseCase
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.response.WorkScheduleResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/work-schedules")
@Tag(name = "Work schedules")
class WorkScheduleController(private val getWorkScheduleUseCase: GetWorkScheduleUseCase) {

    @Operation(summary = "List weekly schedule of a veterinarian")
    @GetMapping
    fun findAllByVeterinarianId(@RequestParam veterinarianId: UUID): ApiResponse<List<WorkScheduleResponse>> =
        ApiResponse.success(getWorkScheduleUseCase.findAllByVeterinarianId(veterinarianId).map { it.toResponse() })
}
