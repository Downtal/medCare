package com.medcare.common.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtService.isTokenValid(token)) {
                    Claims claims = jwtService.extractAllClaims(token);
                    String userId = String.valueOf(claims.get("userId"));
                    String role = (String) claims.get("role");

                    if (userId != null && !"null".equals(userId)) {
                        authenticate(userId, role);
                    }
                }
            } catch (Exception e) {
                log.error("JWT validation failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        // Fallback: Check for Gateway-provided headers
        String headerUserId = request.getHeader("X-User-Id");
        String headerRole = request.getHeader("X-User-Role");
        if (headerUserId != null && !"null".equals(headerUserId)) {
            authenticate(headerUserId, headerRole);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(String userId, String role) {
        List<SimpleGrantedAuthority> authorities = (role != null && !role.isEmpty())
            ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
            : Collections.emptyList();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
