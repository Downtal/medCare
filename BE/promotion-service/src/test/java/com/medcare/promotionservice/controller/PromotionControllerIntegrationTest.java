package com.medcare.promotionservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.promotionservice.dto.VoucherApplyRequest;
import com.medcare.promotionservice.repository.VoucherRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "/data-test.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Transactional
public class PromotionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VoucherRepository voucherRepository;

    @MockBean
    private StringRedisTemplate redisTemplate;

    @Test
    void shouldApplyVoucherSuccessfully() throws Exception {
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(ops);
        when(ops.get(anyString())).thenReturn("100");

        VoucherApplyRequest request = VoucherApplyRequest.builder()
                .code("WELCOME10")
                .items(java.util.List.of(
                        VoucherApplyRequest.OrderItemDto.builder()
                                .price(new BigDecimal("100000"))
                                .quantity(1)
                                .build()
                ))
                .userId(1L)
                .build();

        mockMvc.perform(post("/api/vouchers/apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.discountAmount").value(10000.0));
    }

    @Test
    void shouldFailWhenVoucherNotFound() throws Exception {
        VoucherApplyRequest request = VoucherApplyRequest.builder()
                .code("INVALID")
                .items(java.util.List.of())
                .userId(1L)
                .build();

        mockMvc.perform(post("/api/vouchers/apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Mã giảm giá không tồn tại hoặc đã bị khóa"));
    }

    @Test
    void shouldGetActiveVouchers() throws Exception {
        mockMvc.perform(get("/api/vouchers/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].code").value("WELCOME10"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void shouldGetAllVouchersAsAdmin() throws Exception {
        mockMvc.perform(get("/api/vouchers/admin/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "user", roles = {"USER"})
    void shouldFailToGetAllVouchersAsUser() throws Exception {
        mockMvc.perform(get("/api/vouchers/admin/all"))
                .andExpect(status().isForbidden());
    }
}
