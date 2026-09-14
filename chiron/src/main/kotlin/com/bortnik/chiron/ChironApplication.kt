package com.bortnik.chiron

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class ChironApplication

fun main(args: Array<String>) {
    runApplication<ChironApplication>(*args)
}
