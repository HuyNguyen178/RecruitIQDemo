package com.recruitiq.service;

import com.recruitiq.dto.ForgotPasswordRequest;
import com.recruitiq.dto.LoginRequest;
import com.recruitiq.dto.RegisterRequest;
import com.recruitiq.dto.ResetPasswordRequest;
import com.recruitiq.model.PasswordResetToken;
import com.recruitiq.model.User;
import com.recruitiq.repository.PasswordResetTokenRepository;
import com.recruitiq.repository.UserRepository;
import com.recruitiq.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MailService mailService;

    @InjectMocks
    private AuthService authService;

    @Test
    void authenticate_shouldReturnTokenAndRoles() {
        LoginRequest request = new LoginRequest("hr@example.com", "secret");
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                org.springframework.security.core.userdetails.User.withUsername("hr@example.com")
                        .password("secret")
                        .authorities(new SimpleGrantedAuthority("ROLE_HR_OFFICER"))
                        .build(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_HR_OFFICER"))
        );

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwtUtil.generateToken(any())).thenReturn("jwt-token");

        var response = authService.authenticate(request);

        assertEquals("jwt-token", response.getAccessToken());
        assertEquals("hr@example.com", response.getEmail());
        assertTrue(response.getRoles().contains("ROLE_HR_OFFICER"));
    }

    @Test
    void register_shouldCreateInactiveUserAndSendOtp() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice");
        request.setEmail("alice@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        String result = authService.register(request);

        assertEquals("OTP_REQUIRED", result);
        verify(mailService).sendOtpEmail(anyString(), anyString());
    }

    @Test
    void verifyOtp_shouldThrowWhenOtpIsInvalid() {
        User user = User.builder().email("alice@example.com").otpCode("111111").otpExpiry(LocalDateTime.now().plusMinutes(5)).isActive(false).build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.verifyOtp("alice@example.com", "000000"));

        assertTrue(exception.getMessage().contains("Invalid OTP"));
    }

    @Test
    void forgotPassword_shouldCreateResetTokenAndSendEmail() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", "http://localhost:5173/");
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("alice@example.com");

        User user = User.builder().email("alice@example.com").isActive(true).build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = authService.forgotPassword(request);

        assertEquals("RESET_LINK_SENT", result);
        verify(mailService).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void resetPassword_shouldChangePasswordAndMarkTokenUsed() {
        User user = User.builder().email("alice@example.com").isActive(true).passwordHash("old").build();
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("abc");
        request.setNewPassword("newSecret123");

        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-new");
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = authService.resetPassword(request);

        assertEquals("PASSWORD_RESET_SUCCESS", result);
        assertTrue(token.isUsed());
    }
}
