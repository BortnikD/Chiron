package com.bortnik.chiron.presentation.api.http.mappers

import com.bortnik.chiron.domain.dto.Patch
import org.openapitools.jackson.nullable.JsonNullable

fun <T> JsonNullable<T>.toPatch(): Patch<T> = if (isPresent) Patch.Value(get()) else Patch.Unchanged
