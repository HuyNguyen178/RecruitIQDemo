package com.recruitiq.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "RecruitIQ Account Verification Code";
        String content = "Hello,\n\n" +
                "Thank you for registering at RecruitIQ.\n" +
                "Your account verification code (OTP) is: " + otpCode + "\n" +
                "This code will expire in 10 minutes.\n\n" +
                "If you did not request this code, please ignore this email.\n\n" +
                "Best regards,\n" +
                "RecruitIQ Team";

        log.info("--------------------------------------------------");
        log.info("OTP VERIFICATION EMAIL SENT TO: {}", toEmail);
        log.info("OTP CODE: {}", otpCode);
        log.info("--------------------------------------------------");

        // Output to console directly so developers/reviewers can see it clearly
        System.out.println("==================================================");
        System.out.println(">>> RecruitIQ Verification OTP for " + toEmail + " is: [ " + otpCode + " ] <<<");
        System.out.println("==================================================");

        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email NOT sent to {}, printed to console.", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@recruitiq.com");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {} via SMTP: {}. Falling back to console logging.", toEmail, e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "RecruitIQ Password Reset";
        String content = "Hello,\n\n" +
                "We received a request to reset your RecruitIQ password.\n\n" +
                "Reset your password using the link below (valid for 30 minutes):\n" +
                resetLink + "\n\n" +
                "If you did not request a password reset, you can safely ignore this email.\n\n" +
                "Best regards,\n" +
                "RecruitIQ Team";

        log.info("--------------------------------------------------");
        log.info("PASSWORD RESET EMAIL REQUESTED FOR: {}", toEmail);
        log.info("RESET LINK: {}", resetLink);
        log.info("--------------------------------------------------");

        System.out.println("==================================================");
        System.out.println(">>> RecruitIQ Password Reset link for " + toEmail + " <<<");
        System.out.println(resetLink);
        System.out.println("==================================================");

        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email NOT sent to {}, printed to console.", toEmail);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@recruitiq.com");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {} via SMTP: {}. Falling back to console logging.", toEmail, e.getMessage());
        }
    }
}
