package com.medcare.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.medcare.orderservice.dto.CartItemDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class CartSerializationTest {

    private GenericJackson2JsonRedisSerializer serializer;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.activateDefaultTyping(
                mapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );
        // MedCare uses GenericJackson2JsonRedisSerializer for the cart to avoid ClassCastException
        serializer = new GenericJackson2JsonRedisSerializer(mapper);
    }

    @Test
    void shouldSerializeAndDeserializeCartItemCorrectly() {
        // Given
        CartItemDto original = CartItemDto.builder()
                .medicineId(1L)
                .name("Paracetamol 500mg")
                .quantity(5)
                .unitPrice(new BigDecimal("15000.00"))
                .totalPrice(new BigDecimal("75000.00"))
                .build();

        // When
        byte[] serialized = serializer.serialize(original);
        assertNotNull(serialized);

        CartItemDto deserialized = (CartItemDto) serializer.deserialize(serialized);

        // Then
        assertNotNull(deserialized);
        assertEquals(original.getMedicineId(), deserialized.getMedicineId());
        assertEquals(original.getName(), deserialized.getName());
        assertEquals(original.getQuantity(), deserialized.getQuantity());
        assertEquals(original.getUnitPrice(), deserialized.getUnitPrice());
        assertEquals(original.getTotalPrice(), deserialized.getTotalPrice());
    }

    @Test
    void shouldHandleNullFieldsGracefully() {
        // Given
        CartItemDto minimal = CartItemDto.builder()
                .medicineId(2L)
                .quantity(1)
                .build();

        // When
        byte[] serialized = serializer.serialize(minimal);
        CartItemDto deserialized = (CartItemDto) serializer.deserialize(serialized);

        // Then
        assertEquals(2L, deserialized.getMedicineId());
        assertEquals(1, deserialized.getQuantity());
    }
}
