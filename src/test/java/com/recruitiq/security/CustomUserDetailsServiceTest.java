package com.recruitiq.security;

import com.recruitiq.model.User;
import com.recruitiq.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsername_shouldReturnUserDetailsForActiveUser() {
        User user = User.builder()
                .email("hr@example.com")
                .passwordHash("encoded")
                .role(User.Role.HR_OFFICER)
                .isActive(true)
                .build();
        when(userRepository.findByEmail("hr@example.com")).thenReturn(Optional.of(user));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("hr@example.com");

        assertEquals("hr@example.com", userDetails.getUsername());
        assertEquals("encoded", userDetails.getPassword());
        assertEquals("ROLE_HR_OFFICER", userDetails.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void loadUserByUsername_shouldThrowWhenUserIsInactive() {
        User user = User.builder()
                .email("candidate@example.com")
                .passwordHash("encoded")
                .role(User.Role.CANDIDATE)
                .isActive(false)
                .build();
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(user));

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("candidate@example.com"));
    }
}
