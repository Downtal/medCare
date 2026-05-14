package com.medcare.authservice.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.authservice.entity.User;
import com.medcare.authservice.entity.UserRole;
import com.medcare.authservice.entity.UserStatus;
import com.medcare.authservice.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.FilterChain;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private AuthJwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FilterChain filterChain;

    @Mock
    private MeterRegistry meterRegistry;

    private JwtAuthenticationFilter filter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userRepository, meterRegistry);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldReturn401WithTokenExpiredWhenExpiredJwtException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(mock(Counter.class));
        when(jwtService.extractUsername("expired-token"))
                .thenThrow(new ExpiredJwtException(null, null, "expired"));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertEquals("TOKEN_EXPIRED", body.get("errorCode").asText());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldReturn401WithTokenInvalidWhenMalformedJwtException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer malformed-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(mock(Counter.class));
        when(jwtService.extractUsername("malformed-token"))
                .thenThrow(new MalformedJwtException("bad token"));

        filter.doFilter(request, response, filterChain);

        assertEquals(401, response.getStatus());
        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertEquals("TOKEN_INVALID", body.get("errorCode").asText());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldSetAuthenticationWhenTokenIsValid() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractUsername("valid-token")).thenReturn("alice");
        when(jwtService.isTokenValid(eq("valid-token"), any())).thenReturn(true);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(User.builder()
                .id(1L)
                .username("alice")
                .passwordHash("hashed")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build()));

        filter.doFilter(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(any(), any());
    }
}
