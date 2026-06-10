package com.recruitiq.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.recruitiq.model.User;
import com.recruitiq.validation.ValidationGroups;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {

    @NotBlank(message = "Name is required", groups = ValidationGroups.CreateUser.class)
    @Size(max = 100, message = "Name must be at most 100 characters", groups = ValidationGroups.CreateUser.class)
    String name;

    @NotBlank(message = "Email is required", groups = ValidationGroups.CreateUser.class)
    @Email(message = "Email format is invalid", groups = ValidationGroups.CreateUser.class)
    String email;

    @NotBlank(message = "Password is required", groups = ValidationGroups.CreateUser.class)
    @Size(min = 6, message = "Password must be at least 6 characters", groups = ValidationGroups.CreateUser.class)
    String password;

    /** Required when changing own password via /users/me */
    String currentPassword;

    @NotNull(message = "Role is required", groups = ValidationGroups.CreateUser.class)
    User.Role role;

    @JsonProperty("isActive")
    boolean isActive;

    String avatarUrl;
}
