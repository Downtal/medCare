package com.medcare.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Standardized Gateway Filter Factory for JWT Authentication.
 * Usage in YML: - Authentication
 */
@Slf4j
@Component
public class AuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<AuthenticationGatewayFilterFactory.Config> {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.data.redis.core.ReactiveStringRedisTemplate redisTemplate;

    @Value("${application.security.jwt.revocation.fail-open:true}")
    private boolean failOpen;

    public AuthenticationGatewayFilterFactory() {
        super(Config.class);
    }

    public static class Config {
        // Add config properties if needed
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getPath().toString();

            // 1. Check Authorization Header
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("[GATEWAY] Missing or invalid Authorization header for protected path: {}", path);
                return onError(exchange, "Unauthorized: Missing or invalid token", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            try {
                // 2. Verify JWT
                Claims claims = Jwts.parser()
                        .verifyWith(getSignInKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String userId = String.valueOf(claims.get("userId"));
                String role = (String) claims.get("role");
                long iat = claims.getIssuedAt() != null ? claims.getIssuedAt().getTime() / 1000 : 0;

                log.info("[GATEWAY] Authenticated user {} with role {} for path {}", userId, role, path);

                // 3. Propagate identity headers to downstream microservices
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Role", role)
                        .build();

                String redisKey = "auth:revoked:user:" + userId;
                
                return redisTemplate.opsForValue().get(redisKey)
                        .defaultIfEmpty("NOT_REVOKED")
                        .flatMap(revocationTimeStr -> {
                            if (!"NOT_REVOKED".equals(revocationTimeStr)) {
                                try {
                                    long revocationTime = Long.parseLong(revocationTimeStr);
                                    if (iat <= revocationTime) {
                                        log.warn("[GATEWAY] Token revoked for user {}. iat: {}, revokedAt: {}", userId, iat, revocationTime);
                                        return onError(exchange, "TOKEN_REVOKED", HttpStatus.UNAUTHORIZED);
                                    }
                                } catch (NumberFormatException e) {
                                    log.warn("[GATEWAY] Invalid revocation time in Redis for user {}", userId);
                                }
                            }
                            return chain.filter(exchange.mutate().request(modifiedRequest).build());
                        })
                        .onErrorResume(e -> {
                            log.error("[GATEWAY] Redis error checking revocation for user {}: {}", userId, e.getMessage());
                            if (failOpen) {
                                log.warn("[GATEWAY] Redis fail-open applied for user {}. Security trade-off.", userId);
                                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                            } else {
                                return onError(exchange, "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                        });

            } catch (Exception e) {
                log.error("[GATEWAY] JWT Verification failed for path {}: {}", path, e.getMessage());
                return onError(exchange, "Unauthorized: Token invalid or expired", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format("{\"error\":\"%s\"}", err);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
