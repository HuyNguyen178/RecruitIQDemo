package com.recruitiq.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

public class FutureDeadlineValidator implements ConstraintValidator<FutureDeadline, LocalDate> {

    @Override
    public boolean isValid(LocalDate deadline, ConstraintValidatorContext context) {
        // Allow null values (NotNull annotation handles this)
        if (deadline == null) {
            return true;
        }
        // Deadline must not be in the past
        return !deadline.isBefore(LocalDate.now());
    }
}
