package com.bortnik.chiron.domain.dto

// A nullable field of a partial update. A plain null cannot tell "not sent" from "cleared",
// so Unchanged keeps the stored value and Value(null) clears it.
sealed interface Patch<out T> {
    data object Unchanged : Patch<Nothing>

    data class Value<out T>(val value: T) : Patch<T>
}

fun <T> Patch<T>.orElse(current: T): T = when (this) {
    Patch.Unchanged -> current
    is Patch.Value -> value
}

inline fun <T> Patch<T>.ifPresent(action: (T) -> Unit) {
    if (this is Patch.Value) action(value)
}
