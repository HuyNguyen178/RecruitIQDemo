package com.recruitiq.dto;

import com.recruitiq.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    String name;
    String email;
    String password;
    User.Role role;
    boolean isActive;
}
