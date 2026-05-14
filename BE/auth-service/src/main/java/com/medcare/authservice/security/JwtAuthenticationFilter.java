package com.medcare.authservice.security;

import com.medcare.authservice.repository.UserRepository;
import com.medcare.common.security.JwtAuthErrorType;
import com.medcare.common.security.JwtAuthErrorWriter;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Standard JWT Authentication Filter.
 * Now simplified to rely on short-lived access tokens.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthJwtService jwtService;
    private final UserRepository userRepository;
    private final MeterRegistry meterRegistry;
    private final JwtAuthErrorWriter jwtAuthErrorWriter = new JwtAuthErrorWriter();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username;

        try {
            if (jwt.isBlank()) {
                writeAuthError(request, response, JwtAuthErrorType.TOKEN_MISSING_OR_EMPTY, null);
                return;
            }
            username = jwtService.extractUsername(jwt);
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
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userRepository.findByUsername(username).orElse(null);

            if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeAuthError(
            HttpServletRequest request,
            HttpServletResponse response,
            JwtAuthErrorType errorType,
            Exception exception
    ) throws IOException {
        SecurityContextHolder.clearContext();
        
        meterRegistry.counter("medcare.auth.jwt.errors", "type", errorType.name()).increment();

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
