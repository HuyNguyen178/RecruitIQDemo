package com.recruitiq.service;

import com.recruitiq.dto.UserRequest;
import com.recruitiq.dto.UserResponse;
import com.recruitiq.mapper.UserMapper;
import com.recruitiq.model.User;
import com.recruitiq.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_shouldSaveUserWhenEmailIsAvailable() {
        UserRequest request = new UserRequest();
        request.setEmail("new@example.com");
        request.setPassword("secret123");
        request.setName("New User");
        request.setRole(User.Role.CANDIDATE);

        User user = User.builder().email("new@example.com").name("New User").build();
        UserResponse response = UserResponse.builder().email("new@example.com").name("New User").build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userMapper.toEntity(any(UserRequest.class), anyString())).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toUserListResponse(any(User.class))).thenReturn(response);

        UserResponse result = userService.createUser(request);

        assertEquals("new@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_shouldRejectDuplicateEmail() {
        UserRequest request = new UserRequest();
        request.setEmail("exists@example.com");
        request.setPassword("secret123");
        request.setName("Existing");
        request.setRole(User.Role.CANDIDATE);

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> userService.createUser(request));
    }
}
