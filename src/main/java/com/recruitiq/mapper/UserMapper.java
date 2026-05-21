package com.recruitiq.mapper;

import com.recruitiq.dto.UserRequest;
import com.recruitiq.dto.UserResponse;

import com.recruitiq.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toUserListResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.isActive())
                .build();
    }

    public User toEntity(UserRequest request, String encodedPassword) {
        return User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .role(request.getRole())
                .isActive(request.isActive())
                .build();
    }

}
