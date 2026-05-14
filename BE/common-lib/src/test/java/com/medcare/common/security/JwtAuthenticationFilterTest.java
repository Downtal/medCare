package com.medcare.common.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.FilterChain;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldReturn401WithTokenExpiredWhenExpiredJwtException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractAllClaims("expired-token"))
                .thenThrow(new ExpiredJwtException(null, null, "expired"));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertEquals("TOKEN_EXPIRED", body.get("errorCode").asText());
        assertFalse(body.get("success").asBoolean());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldReturn401WithTokenInvalidWhenMalformedJwtException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer malformed-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractAllClaims("malformed-token"))
                .thenThrow(new MalformedJwtException("bad token"));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertEquals("TOKEN_INVALID", body.get("errorCode").asText());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldNotFallbackToGatewayHeadersWhenBearerTokenInvalid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer bad-signature");
        request.addHeader("X-User-Id", "999");
        request.addHeader("X-User-Role", "ADMIN");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractAllClaims("bad-signature"))
                .thenThrow(new SignatureException("invalid signature"));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNull(authentication);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldFallbackToGatewayHeadersWhenNoBearerToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("X-User-Id", "123");
        request.addHeader("X-User-Role", "ADMIN");
        MockHttpServletResponse response = new MockHttpServletResponse();

        doAnswer(invocation -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            assertNotNull(authentication);
            assertEquals("123", authentication.getPrincipal());
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        verify(filterChain, times(1)).doFilter(any(), any());
    }
}
