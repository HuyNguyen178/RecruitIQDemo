package com.recruitiq.validation;

import com.recruitiq.dto.JobRequest;

import java.time.LocalDate;
import java.util.regex.Pattern;

public final class JobInputValidator {

    private static final Pattern EXPLICIT_NEGATIVE = Pattern.compile("(^|\\s)-\\d");

    private JobInputValidator() {
    }

    public static void validate(JobRequest request, boolean isCreate) {
        if (request.getMinExperienceYears() != null && request.getMinExperienceYears() < 0) {
            throw new IllegalArgumentException("Minimum experience years cannot be negative.");
        }
        if (request.getMinExperienceYears() != null && request.getMinExperienceYears() > 60) {
            throw new IllegalArgumentException("Minimum experience years cannot exceed 60.");
        }
        validateSalary(request.getSalary());
        if (isCreate
                && request.getDeadline() != null
                && request.getDeadline().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Application deadline cannot be in the past.");
        }
    }

    public static void validateSalary(String salary) {
        if (salary == null || salary.isBlank()) {
            return;
        }

        String trimmed = salary.trim();
        if (trimmed.startsWith("-")) {
            throw new IllegalArgumentException("Salary cannot be negative.");
        }
        if (EXPLICIT_NEGATIVE.matcher(trimmed).find()) {
            throw new IllegalArgumentException("Salary cannot contain negative amounts.");
        }

        String compact = trimmed.replaceAll("\\s+", "");
        if (compact.matches("\\d[\\d,]*(?:\\.\\d+)?-\\d[\\d,]*(?:\\.\\d+)?")) {
            String[] parts = compact.split("-", 2);
            assertNonNegativeAmount(parts[0]);
            assertNonNegativeAmount(parts[1]);
            return;
        }

        String numericOnly = trimmed.replaceAll("[^0-9.,-]", "").replaceAll("\\s+", "");
        if (numericOnly.matches("-?\\d[\\d,]*(?:\\.\\d+)?")) {
            assertNonNegativeAmount(numericOnly);
        }
    }

    private static void assertNonNegativeAmount(String raw) {
        String digits = raw.replace(",", "");
        try {
            double value = Double.parseDouble(digits);
            if (value < 0) {
                throw new IllegalArgumentException("Salary cannot contain negative amounts.");
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid salary format.");
        }
    }
}
