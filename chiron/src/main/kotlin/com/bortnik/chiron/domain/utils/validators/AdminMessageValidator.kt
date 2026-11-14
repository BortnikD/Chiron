package com.bortnik.chiron.domain.utils.validators

import com.bortnik.chiron.domain.dto.notification.SendAdminMessageDto
import com.bortnik.chiron.domain.utils.ValidationConstants.NotificationRules

object AdminMessageValidator {
    fun validate(dto: SendAdminMessageDto) = validateAll {
        ensureNotBlank("title", dto.title)
        ensureMaxLength("title", dto.title, NotificationRules.TITLE_MAX_LENGTH)
        ensureNotBlank("body", dto.body)
        ensureMaxLength("body", dto.body, NotificationRules.BODY_MAX_LENGTH)
    }
}
