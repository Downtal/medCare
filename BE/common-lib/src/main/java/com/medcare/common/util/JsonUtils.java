package com.medcare.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@UtilityClass
public class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    /**
     * Convert object to JSON string.
     */
    public static String toJson(Object object) {
        try {
            return MAPPER.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            log.error("[JsonUtils] Serialization error: {}", e.getMessage());
            return "{}";
        }
    }

    /**
     * Parse JSON string into a specific class.
     */
    public static <T> Optional<T> fromJson(String json, Class<T> clazz) {
        try {
            return Optional.of(MAPPER.readValue(json, clazz));
        } catch (JsonProcessingException e) {
            log.error("[JsonUtils] Deserialization error for class {}: {}", clazz.getSimpleName(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Parse JSON string with generic types (e.g., List<User>).
     * Usage: JsonUtils.fromJson(json, new TypeReference<List<User>>() {})
     */
    public static <T> Optional<T> fromJson(String json, TypeReference<T> typeRef) {
        try {
            return Optional.of(MAPPER.readValue(json, typeRef));
        } catch (JsonProcessingException e) {
            log.error("[JsonUtils] Deserialization error for type {}: {}", typeRef.getType(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Get the shared ObjectMapper instance (for configuration reuse).
     */
    public static ObjectMapper getMapper() {
        return MAPPER;
    }
}
