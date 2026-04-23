# Summary: 01-01 - Xây dựng nền tảng common-lib

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Created
- [common-lib/build.gradle](file:///v:/TieuLuanTN/MedCare/BE/common-lib/build.gradle): Cấu hình dependency dùng chung.
- [SharedRedisConfig.java](file:///v:/TieuLuanTN/MedCare/BE/common-lib/src/main/java/com/medcare/common/config/SharedRedisConfig.java): Cấu hình Redis với Jackson JSON Serializer.
- [JwtService.java](file:///v:/TieuLuanTN/MedCare/BE/common-lib/src/main/java/com/medcare/common/security/JwtService.java): Logic xử lý Token tập trung.
- [JwtAuthenticationFilter.java](file:///v:/TieuLuanTN/MedCare/BE/common-lib/src/main/java/com/medcare/common/security/JwtAuthenticationFilter.java): Filter bảo mật dùng chung.
- [.imports](file:///v:/TieuLuanTN/MedCare/BE/common-lib/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports): Khai báo Auto-config cho Spring Boot.

## Decisions Made
- Sử dụng cơ chế Auto-configuration của Spring Boot 3 để các service con tự động nhận Bean mà không cần cấu hình phức tạp.
- Thống nhất sử dụng `GenericJackson2JsonRedisSerializer` để giải quyết lỗi `ClassCastException`.
- Hỗ trợ cả JWT trực tiếp và Header từ API Gateway trong cùng một Filter bảo mật.

## Verification
- Module `common-lib` đã sẵn sàng để các service con kế thừa.
