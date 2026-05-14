package com.medcare.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
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
    private final JwtAuthErrorWriter jwtAuthErrorWriter = new JwtAuthErrorWriter();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        boolean hasBearerToken = false;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            hasBearerToken = true;
            String token = authHeader.substring(7);
            try {
                if (token.isBlank()) {
                    writeAuthError(request, response, JwtAuthErrorType.TOKEN_MISSING_OR_EMPTY, null);
                    return;
                }

                Claims claims = jwtService.extractAllClaims(token);
                String userId = String.valueOf(claims.get("userId"));
                String role = (String) claims.get("role");

                if (userId != null && !"null".equals(userId)) {
                    authenticate(userId, role);
                }
            } catch (ExpiredJwtException e) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_EXPIRED, e);
                return;
            } catch (MalformedJwtException | SignatureException e) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_INVALID, e);
                return;
            } catch (UnsupportedJwtException e) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_UNSUPPORTED, e);
                return;
            } catch (IllegalArgumentException e) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_MISSING_OR_EMPTY, e);
                return;
            } catch (JwtException e) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_INVALID, e);
                return;
            } catch (Exception e) {
                log.warn("Unexpected JWT processing failure. path={} method={} remoteIp={} exceptionClass={}",
                        request.getRequestURI(), request.getMethod(), request.getRemoteAddr(), e.getClass().getSimpleName());
                SecurityContextHolder.clearContext();
            }
        }

        // Fallback: Check for Gateway-provided headers
        if (!hasBearerToken) {
            String headerUserId = request.getHeader("X-User-Id");
            String headerRole = request.getHeader("X-User-Role");
            if (headerUserId != null && !"null".equals(headerUserId)) {
                authenticate(headerUserId, headerRole);
            }
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

    private void writeAuthError(
            HttpServletRequest request,
            HttpServletResponse response,
            JwtAuthErrorType errorType,
            Exception exception
    ) throws IOException {
        SecurityContextHolder.clearContext();

        if (errorType == JwtAuthErrorType.TOKEN_EXPIRED) {
            log.debug("JWT auth failed. errorCode={} path={} method={} remoteIp={} exceptionClass={}",
                    errorType.getCode(), request.getRequestURI(), request.getMethod(), request.getRemoteAddr(),
                    exception == null ? "N/A" : exception.getClass().getSimpleName());
        } else {
            log.warn("JWT auth failed. errorCode={} path={} method={} remoteIp={} exceptionClass={}",
                    errorType.getCode(), request.getRequestURI(), request.getMethod(), request.getRemoteAddr(),
                    exception == null ? "N/A" : exception.getClass().getSimpleName());
        }
        jwtAuthErrorWriter.writeUnauthorized(response, errorType);
    }
}
