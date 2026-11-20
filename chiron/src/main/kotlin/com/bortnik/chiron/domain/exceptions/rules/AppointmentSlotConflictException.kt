package com.bortnik.chiron.domain.exceptions.rules

import com.bortnik.chiron.domain.exceptions.ConflictException

class AppointmentSlotConflictException(cause: Throwable? = null) :
    ConflictException("The slot overlaps another appointment", cause)
