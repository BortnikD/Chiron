package com.bortnik.chiron.domain.exceptions

class InvalidCredentialsException(message: String = "Invalid email or password") : DomainException(message)
