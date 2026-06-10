package com.recruitiq.service;

import com.recruitiq.dto.UserRequest;
import com.recruitiq.dto.UserResponse;
import com.recruitiq.mapper.UserMapper;
import com.recruitiq.model.User;
import com.recruitiq.repository.UserRepository;
import com.recruitiq.validation.UserInputValidator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserListResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        UserInputValidator.validateForCreate(request);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = userMapper.toEntity(request, encodedPassword);

        User savedUser = userRepository.save(user);

        return userMapper.toUserListResponse(savedUser);
    }

    @Transactional
    public UserResponse changeStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        user.setActive(!user.isActive());
        User updatedUser = userRepository.save(user);
        return userMapper.toUserListResponse(updatedUser);
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        return userMapper.toUserListResponse(user);
    }

    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return userMapper.toUserListResponse(user);
    }

    @Transactional
    public UserResponse updateCurrentUser(String currentEmail, UserRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + currentEmail));

        boolean emailChanging = request.getEmail() != null
                && !request.getEmail().equalsIgnoreCase(user.getEmail());
        boolean passwordChanging = request.getPassword() != null && !request.getPassword().trim().isEmpty();
        boolean nameChanging = request.getName() != null && !request.getName().equals(user.getName());
        boolean avatarChanging = request.getAvatarUrl() != null
                && !Objects.equals(normalizeAvatarUrl(request.getAvatarUrl()), user.getAvatarUrl());

        if (emailChanging || passwordChanging || nameChanging || avatarChanging) {
            verifyCurrentPassword(request, user);
        }

        if (emailChanging) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (nameChanging) {
            user.setName(request.getName());
        }

        if (avatarChanging) {
            user.setAvatarUrl(normalizeAvatarUrl(request.getAvatarUrl()));
        }

        if (passwordChanging) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        return userMapper.toUserListResponse(updated);
    }

    private void verifyCurrentPassword(UserRequest request, User user) {
        if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Current password is required to confirm this change.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
    }

    private String normalizeAvatarUrl(String avatarUrl) {
        return avatarUrl == null || avatarUrl.isBlank() ? null : avatarUrl;
    }

    @Transactional
    public UserResponse updateUser(Long userId, UserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setActive(request.isActive());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toUserListResponse(updatedUser);
    }
}
