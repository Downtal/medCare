package com.medcare.gateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class DebugController {

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.database:0}")
    private int redisDatabase;

    @GetMapping("/debug-redis/{userId}")
    public Mono<String> debugRedis(@PathVariable String userId) {
        return redisTemplate.opsForValue().get("blacklist:user:" + userId)
                .map(v -> String.format(
                        "{\"host\":\"%s\",\"port\":%d,\"database\":%d,\"value\":\"%s\"}",
                        redisHost, redisPort, redisDatabase, v
                ))
                .defaultIfEmpty(String.format(
                        "{\"host\":\"%s\",\"port\":%d,\"database\":%d,\"empty\":true}",
                        redisHost, redisPort, redisDatabase
                ));
    }
}
