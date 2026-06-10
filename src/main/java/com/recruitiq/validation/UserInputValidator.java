package com.recruitiq.validation;

import com.recruitiq.dto.UserRequest;

public final class UserInputValidator {

    private UserInputValidator() {
    }

    public static void validateForCreate(UserRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }
        if (request.getName().length() > 100) {
            throw new IllegalArgumentException("Name must be at most 100 characters.");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (!request.getEmail().matches("^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("Email format is invalid.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Role is required.");
        }
    }
}
