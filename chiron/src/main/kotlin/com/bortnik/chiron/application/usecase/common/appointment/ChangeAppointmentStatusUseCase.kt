package com.bortnik.chiron.application.usecase.common.appointment

import com.bortnik.chiron.domain.dto.Patch
import com.bortnik.chiron.domain.dto.appointment.UpdateAppointmentDto
import com.bortnik.chiron.domain.entities.Appointment
import com.bortnik.chiron.domain.entities.enums.AppointmentStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class ChangeAppointmentStatusUseCase(private val updateAppointmentUseCase: UpdateAppointmentUseCase) {

    // The common update rechecks cancellation metadata against the locked appointment.
    fun change(
        appointment: Appointment,
        status: AppointmentStatus,
        actorId: UUID,
        vetNotes: Patch<String?>,
        cancelReason: String?,
        serviceIds: List<UUID>? = null,
        performedServiceIds: List<UUID>? = null,
        endAt: Instant? = null,
    ): Appointment {
        val dto = UpdateAppointmentDto(
            status = status,
            vetNotes = vetNotes,
            serviceIds = serviceIds,
            performedServiceIds = performedServiceIds,
            endAt = endAt,
        )
        val cancelling = status == AppointmentStatus.CANCELLED && appointment.status != AppointmentStatus.CANCELLED
        return updateAppointmentUseCase.update(
            appointment.id,
            if (cancelling) {
                dto.copy(
                    cancelledBy = Patch.Value(actorId),
                    cancelledAt = Patch.Value(Instant.now()),
                    cancelReason = Patch.Value(cancelReason),
                )
            } else {
                dto
            },
            actorId,
        )
    }
}
