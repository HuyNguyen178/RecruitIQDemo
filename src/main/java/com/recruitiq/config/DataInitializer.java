package com.recruitiq.config;

import com.recruitiq.model.User;
import com.recruitiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() == 0) {
            log.info("Initializing default users...");

            User admin = User.builder()
                    .name("Administrator")
                    .email("admin@recruitiq.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);

            User hrOfficer = User.builder()
                    .name("HR Officer")
                    .email("hr@recruitiq.com")
                    .passwordHash(passwordEncoder.encode("hr123"))
                    .role(User.Role.HR_OFFICER)
                    .isActive(true)
                    .build();
            userRepository.save(hrOfficer);

            User candidate = User.builder()
                    .name("Candidate")
                    .email("candidate@recruitiq.com")
                    .passwordHash(passwordEncoder.encode("candidate123"))
                    .role(User.Role.CANDIDATE)
                    .isActive(true)
                    .build();
            userRepository.save(candidate);

            log.info("Default users created: admin@recruitiq.com (admin123) " +
                    "and hr@recruitiq.com (hr123) " +
                    "and candidate@recruitiq.com (candidate123)");
        }
    }
}
