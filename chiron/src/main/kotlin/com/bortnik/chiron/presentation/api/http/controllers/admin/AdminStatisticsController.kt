package com.bortnik.chiron.presentation.api.http.controllers.admin

import com.bortnik.chiron.application.usecase.admin.statistics.AdminGetStatisticsUseCase
import com.bortnik.chiron.domain.dto.statistics.StatisticsGranularity
import com.bortnik.chiron.presentation.api.http.ApiResponse
import com.bortnik.chiron.presentation.api.http.dto.request.statistics.StatisticsPeriodRequest
import com.bortnik.chiron.presentation.api.http.dto.response.OverviewStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.ServiceStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.SpeciesStatisticsResponse
import com.bortnik.chiron.presentation.api.http.dto.response.TimelinePointResponse
import com.bortnik.chiron.presentation.api.http.dto.response.VeterinarianStatisticsResponse
import com.bortnik.chiron.presentation.api.http.mappers.toResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/admin/statistics")
@Tag(name = "Admin: Statistics")
class AdminStatisticsController(
    private val getStatisticsUseCase: AdminGetStatisticsUseCase,
) {
    @Operation(
        summary = "Get statistics overview",
        description = """
            Appointments are counted by start time within the period, both dates inclusive, in the clinic time zone;
            without dates the current month is used.
            Revenue sums the price snapshots of COMPLETED appointments, expectedRevenue of PENDING and CONFIRMED.
            cancellationRate = CANCELLED / all; noShowRate = NO_SHOW / (COMPLETED + NO_SHOW);
            rates and averageCheck are null when there is nothing to divide by.
            newClients and newPets count client accounts and pets created in the period.
        """,
    )
    @GetMapping("/overview")
    fun getOverview(@ParameterObject period: StatisticsPeriodRequest): ApiResponse<OverviewStatisticsResponse> =
        ApiResponse.success(getStatisticsUseCase.getOverview(period.from, period.to).toResponse())

    @Operation(
        summary = "Get appointments and revenue over time",
        description = """
            One point per day, week (starting on Monday) or month that overlaps the period, including empty ones,
            sorted by periodStart. Only appointments inside the period are counted, so the first and last week or
            month may be partial.
        """,
    )
    @GetMapping("/timeline")
    fun getTimeline(
        @ParameterObject period: StatisticsPeriodRequest,
        @Parameter(description = "Bucket size") @RequestParam(defaultValue = "DAY") granularity: StatisticsGranularity,
    ): ApiResponse<List<TimelinePointResponse>> =
        ApiResponse.success(
            getStatisticsUseCase.getTimeline(period.from, period.to, granularity).map { it.toResponse() },
        )

    @Operation(
        summary = "Get statistics by veterinarian",
        description = "Only veterinarians with appointments in the period, sorted by revenue descending, then by name.",
    )
    @GetMapping("/veterinarians")
    fun getVeterinarians(
        @ParameterObject period: StatisticsPeriodRequest,
    ): ApiResponse<List<VeterinarianStatisticsResponse>> =
        ApiResponse.success(getStatisticsUseCase.getVeterinarians(period.from, period.to).map { it.toResponse() })

    @Operation(
        summary = "Get statistics by service",
        description = "Only services with appointments in the period, sorted by revenue descending, then by name.",
    )
    @GetMapping("/services")
    fun getServices(@ParameterObject period: StatisticsPeriodRequest): ApiResponse<List<ServiceStatisticsResponse>> =
        ApiResponse.success(getStatisticsUseCase.getServices(period.from, period.to).map { it.toResponse() })

    @Operation(
        summary = "Get statistics by species",
        description = """
            Every species, sorted by revenue descending, then by name.
            activePets is the current number of non-archived pets and does not depend on the period.
        """,
    )
    @GetMapping("/species")
    fun getSpecies(@ParameterObject period: StatisticsPeriodRequest): ApiResponse<List<SpeciesStatisticsResponse>> =
        ApiResponse.success(getStatisticsUseCase.getSpecies(period.from, period.to).map { it.toResponse() })
}
