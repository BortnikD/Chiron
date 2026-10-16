package com.bortnik.chiron.infrastructure.config

import io.swagger.v3.core.converter.AnnotatedType
import io.swagger.v3.core.converter.ModelConverter
import io.swagger.v3.core.converter.ModelConverterContext
import io.swagger.v3.core.util.Json
import io.swagger.v3.oas.models.SpecVersion
import io.swagger.v3.oas.models.media.Schema
import org.openapitools.jackson.nullable.JsonNullable
import org.springframework.stereotype.Component

// Without this, swagger describes JsonNullable<T> as a wrapper object with "present" / "undefined" fields.
// The field is documented as its value type T, marked nullable.
@Component
class JsonNullableModelConverter : ModelConverter {

    override fun resolve(
        type: AnnotatedType,
        context: ModelConverterContext,
        chain: Iterator<ModelConverter>,
    ): Schema<*>? {
        if (!chain.hasNext()) return null
        val javaType = Json.mapper().constructType(type.type)
        if (!javaType.isTypeOrSubTypeOf(JsonNullable::class.java)) return chain.next().resolve(type, context, chain)

        // Validation annotations of the field (@Size, @DecimalMin, ...) are passed on to the value schema.
        val valueType = AnnotatedType(javaType.containedType(0))
            .ctxAnnotations(type.ctxAnnotations)
            .parent(type.parent)
            .propertyName(type.propertyName)
            .schemaProperty(type.isSchemaProperty)
            .resolveAsRef(type.isResolveAsRef)
        return chain.next().resolve(valueType, context, chain)?.apply {
            if (specVersion == SpecVersion.V31) {
                types = (types ?: setOfNotNull(this.type)) + "null"
            } else {
                nullable = true
            }
        }
    }
}
