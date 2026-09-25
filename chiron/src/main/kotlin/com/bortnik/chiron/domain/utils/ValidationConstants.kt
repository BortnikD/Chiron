package com.bortnik.chiron.domain.utils

// Bounds mirror the SQL migration (NUMERIC precision, CHECK constraints); text lengths are not
// constrained in SQL (TEXT columns), so the limits below are application-level choices.
object ValidationConstants {
    // NUMERIC(13, 2)
    const val MONEY_MIN = 0.0
    const val MONEY_MAX = 99_999_999_999.99

    const val MINUTES_PER_DAY = 24 * 60

    const val SEARCH_MAX_LENGTH = 100

    object UserRules {
        const val EMAIL_MAX_LENGTH = 254
        const val NAME_MAX_LENGTH = 100
        const val FULL_NAME_MAX_LENGTH = 300
        const val PASSWORD_MIN_LENGTH = 8
        // BCrypt rejects passwords longer than 72 bytes.
        const val PASSWORD_MAX_BYTES = 72
        // Upper bounds for login input, checked before the database lookup and hashing.
        const val LOGIN_EMAIL_MAX_LENGTH = 256
        const val LOGIN_PASSWORD_MAX_LENGTH = 512
        // Kept as strings so that presentation-layer @Pattern annotations can reuse them.
        const val EMAIL_PATTERN = """^[^@\s]+@[^@\s]+\.[^@\s]+$"""
        const val PHONE_PATTERN = """^\+?[0-9]{10,15}$"""
        val EMAIL_REGEX = Regex(EMAIL_PATTERN)
        val PHONE_REGEX = Regex(PHONE_PATTERN)
    }

    object PetRules {
        const val NAME_MAX_LENGTH = 100
        const val NOTES_MAX_LENGTH = 2000
        // NUMERIC(6, 2), CHECK (weight_kg > 0)
        const val WEIGHT_MIN_EXCLUSIVE = 0.0
        const val WEIGHT_MAX = 9_999.99
    }

    object SpeciesRules {
        const val NAME_MAX_LENGTH = 100
    }

    object SpecializationRules {
        const val NAME_MAX_LENGTH = 150
        const val DESCRIPTION_MAX_LENGTH = 2000
    }

    object ServiceRules {
        const val NAME_MAX_LENGTH = 150
        const val DESCRIPTION_MAX_LENGTH = 2000
        // CHECK (base_duration_min > 0)
        const val DURATION_MIN_MINUTES = 1
        const val DURATION_MAX_MINUTES = MINUTES_PER_DAY
        // CHECK (buffer_after_min >= 0)
        const val BUFFER_MIN_MINUTES = 0
        const val BUFFER_MAX_MINUTES = 240
    }

    object VeterinarianRules {
        const val BIO_MAX_LENGTH = 4000
        const val PHOTO_URL_MAX_LENGTH = 2048
        // CHECK (experience_years >= 0)
        const val EXPERIENCE_YEARS_MIN = 0
        const val EXPERIENCE_YEARS_MAX = 70
    }

    object ScheduleExceptionRules {
        const val REASON_MAX_LENGTH = 1000
    }

    object AppointmentRules {
        const val CLIENT_COMMENT_MAX_LENGTH = 1000
        const val VET_NOTES_MAX_LENGTH = 4000
        const val CANCEL_REASON_MAX_LENGTH = 1000
        const val MAX_DURATION_MINUTES = MINUTES_PER_DAY
    }

    object VaccinationRules {
        const val NAME_MAX_LENGTH = 150
    }

    object PaginationRules {
        const val DEFAULT_SIZE = 20
        const val SIZE_MIN = 1
        const val SIZE_MAX = 100
    }
}
