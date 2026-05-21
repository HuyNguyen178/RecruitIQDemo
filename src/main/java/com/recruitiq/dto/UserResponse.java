package com.recruitiq.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.recruitiq.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    Long id;
    String name;
    String email;
    User.Role role;
    
    @JsonProperty("isActive")
    boolean isActive;
}
