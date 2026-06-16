package com.recruitiq.service;

import com.recruitiq.dto.AuthResponse;
import com.recruitiq.dto.ForgotPasswordRequest;
import com.recruitiq.dto.LoginRequest;
import com.recruitiq.dto.RegisterRequest;
import com.recruitiq.dto.ResetPasswordRequest;
import com.recruitiq.model.PasswordResetToken;
import com.recruitiq.model.User;
import com.recruitiq.repository.PasswordResetTokenRepository;
import com.recruitiq.repository.UserRepository;
import com.recruitiq.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import java.time.LocalDateTime;
import jakarta.persistence.EntityNotFoundException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    @Value("${recruitiq.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;


    public AuthResponse authenticate(LoginRequest loginRequest) {
        // 1. Xác thực Email và Password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Lấy thông tin UserDetails sau khi xác thực thành công
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 3. Tạo Token bằng JwtUtil bạn đã có
        String jwt = jwtUtil.generateToken(userDetails);

        // 4. Lấy danh sách Roles (Quyền)
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // 5. Trả về thông tin cho Controller
        return AuthResponse.builder()
                .accessToken(jwt)
                .email(userDetails.getUsername())
                .roles(roles)
                .build();
    }

    @Transactional
    public String register(RegisterRequest request) {
        User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existingUser != null) {
            if (existingUser.isActive()) {
                throw new IllegalArgumentException("Email already exists!");
            } else {
                userRepository.delete(existingUser);
                userRepository.flush(); // delete immediately from DB
            }
        }

        User.Role userRole = User.Role.CANDIDATE;

        String otpCode = String.format("%06d", new java.util.Random().nextInt(1000000));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .isActive(false) // Inactive until verified
                .otpCode(otpCode)
                .otpExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        userRepository.save(user);

        // Send OTP via email
        mailService.sendOtpEmail(request.getEmail(), otpCode);

        return "OTP_REQUIRED";
    }

    @Transactional
    public String verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        if (user.isActive()) {
            return "ALREADY_ACTIVE";
        }

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP verification code!");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP code has expired! Please request a new code.");
        }

        user.setActive(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "SUCCESS";
    }

    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        if (user.isActive()) {
            return "ALREADY_ACTIVE";
        }

        String otpCode = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        mailService.sendOtpEmail(email, otpCode);

        return "OTP_SENT";
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();

        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty() || !maybeUser.get().isActive()) {
            // Avoid email enumeration: always return the same response.
            return "RESET_LINK_SENT";
        }

        User user = maybeUser.get();

        String rawToken = generateToken();
        String tokenHash = sha256Hex(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendBaseUrl.replaceAll("/+$", "") + "/auth/reset-password?token=" + rawToken;
        mailService.sendPasswordResetEmail(email, resetLink);

        return "RESET_LINK_SENT";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        String tokenHash = sha256Hex(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or has expired."));

        LocalDateTime now = LocalDateTime.now();
        if (resetToken.isUsed() || resetToken.isExpired(now)) {
            throw new IllegalArgumentException("Reset link is invalid or has expired.");
        }

        User user = resetToken.getUser();
        if (user == null || !user.isActive()) {
            throw new IllegalArgumentException("Reset link is invalid or has expired.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        return "PASSWORD_RESET_SUCCESS";
    }

    private static String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot hash token", e);
        }
    }
}