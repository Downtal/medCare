package com.medcare.authservice.config;

import com.medcare.authservice.entity.User;
import com.medcare.authservice.entity.UserStatus;
import com.medcare.authservice.repository.UserRepository;
import com.medcare.authservice.client.UserClient;
import com.medcare.authservice.dto.UserProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserClient userClient;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .email("admin@medcare.com")
                    .phone("0988888888")
                    .role(com.medcare.authservice.entity.UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();

            User savedAdmin = userRepository.save(admin);
            
            try {
                UserProfileRequest profileRequest = UserProfileRequest.builder()
                        .userId(savedAdmin.getId())
                        .fullName("Super Admin")
                        .email("admin@medcare.com")
                        .phone("0988888888")
                        .build();
                userClient.createProfile(profileRequest);
            } catch (Exception e) {
                System.err.println("Could not create admin profile in user-service: " + e.getMessage());
            }

            System.out.println("Default Admin account created: admin / admin123");
        }
    }
}
