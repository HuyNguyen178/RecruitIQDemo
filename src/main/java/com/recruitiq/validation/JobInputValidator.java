package com.recruitiq.validation;

import java.util.regex.Pattern;

/**
 * Utility validator for complex salary format validation.
 * Used by @ValidSalary annotation to validate salary ranges and formats.
 * 
 * NOTE: Experience years and deadline validation moved to DTO annotations (@Min, @Max, @FutureDeadline)
 * to follow DRY principle and avoid redundant service-level validation.
 */
public final class JobInputValidator {

    private static final Pattern EXPLICIT_NEGATIVE = Pattern.compile("(^|\\s)-\\d");

    private JobInputValidator() {
    }

    /**
     * Validates salary format and values.
     * Supports:
     * - Single amounts: "100", "100,000", "100,000.50"
     * - Ranges: "100-200", "100,000-150,000.50"
     * Rejects negative values and invalid formats.
     */
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
