package com.recruitiq.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom validator for job application deadlines.
 * Validates that the deadline is not in the past.
 * Only applied during job creation (not updates).
 */
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = FutureDeadlineValidator.class)
public @interface FutureDeadline {
    String message() default "Application deadline cannot be in the past";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
