package com.bortnik.chiron.domain.utils

// Display name "I. M. Lastname"; V02__reformat_user_full_name.sql applies the same rule to existing rows.
object FullNameFormatter {

    fun format(firstName: String, middleName: String?, lastName: String): String =
        listOfNotNull(firstName.initial(), middleName?.initial(), lastName.trim()).joinToString(" ")

    private fun String.initial(): String? = trim().firstOrNull()?.let { "${it.uppercaseChar()}." }
}
