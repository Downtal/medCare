package com.medcare.userservice.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.common.security.JwtAuthenticationFilter;
import com.medcare.common.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserControllerAuthErrorIntegrationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldReturn401TokenMissingOrEmptyForProfilePathWhenBearerIsEmpty() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService);
        FilterChain filterChain = mock(FilterChain.class);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer ");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertEquals("TOKEN_MISSING_OR_EMPTY", body.get("errorCode").asText());
        verify(filterChain, never()).doFilter(any(), any());
    }
}
