package com.recruitiq.service;

import com.recruitiq.dto.AuthResponse;
import com.recruitiq.dto.LoginRequest;
import com.recruitiq.dto.RegisterRequest;
import com.recruitiq.model.User;
import com.recruitiq.repository.UserRepository;
import com.recruitiq.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists!");
        }

        User.Role userRole = User.Role.CANDIDATE;
        if (request.getRole() != null) {
            try {
                userRole = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore and use default
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .isActive(true)
                .build();

        userRepository.save(user);
        return "Register Success";
    }
}