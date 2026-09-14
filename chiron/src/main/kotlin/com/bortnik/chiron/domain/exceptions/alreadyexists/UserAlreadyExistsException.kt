package com.bortnik.chiron.domain.exceptions.alreadyexists

import com.bortnik.chiron.domain.exceptions.EntityAlreadyExistsException

class UserAlreadyExistsException(criteria: Map<String, Any?>) : EntityAlreadyExistsException(ENTITY_NAME, criteria) {

    constructor(field: String, value: Any?) : this(mapOf(field to value))

    companion object {
        const val ENTITY_NAME = "User"

        fun byEmail(email: String) = UserAlreadyExistsException("email", email)

        fun byPhone(phone: String) = UserAlreadyExistsException("phone", phone)
    }
}
