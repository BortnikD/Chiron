package com.bortnik.chiron.application.photo

import java.io.InputStream

interface PhotoProcessor {
    fun process(input: InputStream): PhotoVariants
}
