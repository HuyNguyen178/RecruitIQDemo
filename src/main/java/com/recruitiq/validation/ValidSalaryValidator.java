package com.recruitiq.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidSalaryValidator implements ConstraintValidator<ValidSalary, String> {

    @Override
    public boolean isValid(String salary, ConstraintValidatorContext context) {
        try {
            JobInputValidator.validateSalary(salary);
            return true;
        } catch (IllegalArgumentException ex) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(ex.getMessage()).addConstraintViolation();
            return false;
        }
    }
}
