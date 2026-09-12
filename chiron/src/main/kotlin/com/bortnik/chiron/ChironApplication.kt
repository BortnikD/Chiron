package com.bortnik.chiron

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ChironApplication

fun main(args: Array<String>) {
    runApplication<ChironApplication>(*args)
}
