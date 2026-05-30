package com.medcare.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
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
 * Gateway JWT Authentication Filter.
 *
 * Usage in application.yml:
 *
 * spring:
 *   cloud:
 *     gateway:
 */
@Slf4j
@Component
public class AuthenticationGatewayFilterFactory
        extends AbstractGatewayFilterFactory<AuthenticationGatewayFilterFactory.Config> {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    @Value("${application.security.jwt.revocation.fail-open:true}")
    private boolean failOpen;

    public AuthenticationGatewayFilterFactory() {
        super(Config.class);
    }

    public static class Config {
        // Reserved for future config properties
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getPath().toString();

            /*
             * 1. Skip authentication for public endpoints.
             * Important: because this filter is used as default-filter,
             * it will run for all routes, including auth-service.
             */
            if (isPublicPath(path)) {
                log.info("[GATEWAY] Public path skip authentication: {}", path);
                return chain.filter(exchange);
            }

            log.warn("[GATEWAY] Authentication filter triggered path={}", path);

            /*
             * 2. Check Authorization header.
             */
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("[GATEWAY] Missing or invalid Authorization header for protected path: {}", path);
                return onError(exchange, "MISSING_TOKEN", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);

            try {
                /*
                 * 3. Verify JWT.
                 */
                Claims claims = Jwts.parser()
                        .verifyWith(getSignInKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                Object userIdClaim = claims.get("userId");
                Object roleClaim = claims.get("role");

                if (userIdClaim == null) {
                    log.warn("[GATEWAY] JWT missing userId claim for path={}", path);
                    return onError(exchange, "INVALID_TOKEN", HttpStatus.UNAUTHORIZED);
                }

                String userId = String.valueOf(userIdClaim);
                String role = roleClaim != null ? String.valueOf(roleClaim) : "";

                long tokenIat = claims.getIssuedAt() != null
                        ? claims.getIssuedAt().toInstant().getEpochSecond()
                        : 0L;

                log.info(
                        "[GATEWAY] JWT parsed path={}, userId={}, role={}, tokenIat={}",
                        path,
                        userId,
                        role,
                        tokenIat
                );

                /*
                 * 4. Propagate identity headers to downstream services.
                 */
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Role", role)
                        .build();

                /*
                 * 5. Redis session revocation check.
                 *
                 * Redis key:
                 * auth:revoked:user:{userId}
                 *
                 * Value:
                 * epoch seconds revocation time
                 */
                String redisKey = "auth:revoked:user:" + userId;

                return redisTemplate.opsForValue()
                        .get(redisKey)
                        .defaultIfEmpty("NOT_REVOKED")
                        .flatMap(revocationTimeStr -> {
                            if (!"NOT_REVOKED".equals(revocationTimeStr)) {
                                try {
                                    long revocationTime = Long.parseLong(revocationTimeStr);

                                    log.warn(
                                            "[GATEWAY] Session revoked check - userId: {}, tokenIat: {}, revocationTime: {}, Redis key: {}, path: {}",
                                            userId,
                                            tokenIat,
                                            revocationTime,
                                            redisKey,
                                            path
                                    );

                                    if (tokenIat <= revocationTime) {
                                        log.warn(
                                                "[GATEWAY] Session revoked check - userId: {}, tokenIat: {}, revocationTime: {}, Redis key: {}, decision: revoked",
                                                userId,
                                                tokenIat,
                                                revocationTime,
                                                redisKey
                                        );

                                        return onError(exchange, "TOKEN_REVOKED", HttpStatus.UNAUTHORIZED);
                                    }

                                    log.info(
                                            "[GATEWAY] Session revoked check - userId: {}, tokenIat: {}, revocationTime: {}, Redis key: {}, decision: allowed",
                                            userId,
                                            tokenIat,
                                            revocationTime,
                                            redisKey
                                    );

                                } catch (NumberFormatException e) {
                                    log.warn(
                                            "[GATEWAY] Invalid revocation time in Redis. userId={}, redisKey={}, value={}",
                                            userId,
                                            redisKey,
                                            revocationTimeStr
                                    );
                                }
                            } else {
                                log.info(
                                        "[GATEWAY] Session revoked check - userId: {}, Redis key: {}, decision: allowed-not-revoked",
                                        userId,
                                        redisKey
                                );
                            }

                            return chain.filter(exchange.mutate().request(modifiedRequest).build());
                        })
                        .onErrorResume(e -> {
                            log.error(
                                    "[GATEWAY] Redis error checking revocation. userId={}, redisKey={}, path={}, error={}",
                                    userId,
                                    redisKey,
                                    path,
                                    e.getMessage()
                            );

                            if (failOpen) {
                                log.warn(
                                        "[GATEWAY] Redis fail-open applied. userId={}, path={}, decision=allowed-security-tradeoff",
                                        userId,
                                        path
                                );

                                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                            }

                            log.error(
                                    "[GATEWAY] Redis fail-closed applied. userId={}, path={}, decision=blocked",
                                    userId,
                                    path
                            );

                            return onError(exchange, "SESSION_VALIDATION_ERROR", HttpStatus.UNAUTHORIZED);
                        });

            } catch (Exception e) {
                log.error(
                        "[GATEWAY] JWT verification failed for path={}: {}",
                        path,
                        e.getMessage()
                );

                return onError(exchange, "INVALID_TOKEN", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    /**
     * Public endpoints that do not require JWT authentication.
     *
     * Because Authentication is configured as default-filter,
     * every request goes through this filter.
     * Therefore login/register/OAuth/forgot-password must be skipped manually.
     */
    private boolean isPublicPath(String path) {
        return path.startsWith("/auth-service/api/auth/login")
                || path.startsWith("/auth-service/api/auth/register")
                || path.startsWith("/auth-service/api/auth/refresh-token")
                || path.startsWith("/auth-service/api/auth/refresh")
                || path.startsWith("/auth-service/api/auth/forgot-password")
                || path.startsWith("/auth-service/api/auth/reset-password")
                || path.startsWith("/auth-service/oauth2/")
                || path.startsWith("/auth-service/login/oauth2/")
                || path.startsWith("/auth-service/api/oauth2/")
                || path.startsWith("/auth-service/api/auth/oauth2/")
                || path.startsWith("/ai-service/api/recommendations/home")
                || path.startsWith("/ai-service/api/recommendations/related")
                || path.startsWith("/ai-service/api/ai/stream")
                || path.startsWith("/ai-service/api/ai/feedback")
                || path.startsWith("/api/recommendations/home")
                || path.startsWith("/actuator")
                // Các API công khai gọi từ Frontend
                || path.startsWith("/product-service/api/products")
                || path.startsWith("/product-service/api/categories")
                || path.startsWith("/review-service/api/reviews")
                || path.startsWith("/shipping-service/api/shipping")
                || path.startsWith("/promotion-service/api/vouchers/active")
                || path.startsWith("/inventory-service/api/inventory/product")
                || path.startsWith("/payment-service/api/payment/vnpay-ipn")
                || path.startsWith("/payment-service/api/payment/vnpay-callback");
    }

    private Mono<Void> onError(ServerWebExchange exchange, String code, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();

        if (response.isCommitted()) {
            return Mono.empty();
        }

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String message = switch (code) {
            case "TOKEN_REVOKED" -> "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.";
            case "ACCOUNT_DISABLED" -> "Tài khoản đã bị khóa hoặc không còn hoạt động.";
            case "MISSING_TOKEN" -> "Thiếu token xác thực.";
            case "INVALID_TOKEN" -> "Token không hợp lệ hoặc đã hết hạn.";
            case "SESSION_VALIDATION_ERROR" -> "Không thể xác thực phiên đăng nhập.";
            default -> "Không có quyền truy cập.";
        };

        String body = String.format(
                "{\"code\":\"%s\",\"message\":\"%s\"}",
                escapeJson(code),
                escapeJson(message)
        );

        return response.writeWith(
                Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8)))
        );
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}