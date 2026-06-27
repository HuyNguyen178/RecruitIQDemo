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

    public void sendDecisionEmail(String toEmail, String candidateName, String jobTitle, String status, String hrNotes) {
        String subject = "RecruitIQ - Application Status Update: " + jobTitle;
        String content = "";

        if ("SHORTLISTED".equalsIgnoreCase(status)) {
            content = "Dear " + candidateName + ",\n\n" +
                    "Congratulations! We are pleased to inform you that you have been shortlisted for the position of \"" + jobTitle + "\".\n\n" +
                    (hrNotes != null && !hrNotes.trim().isEmpty() ? "HR Notes / Next Steps:\n" + hrNotes + "\n\n" : "") +
                    "Our team will contact you shortly to discuss the next steps.\n\n" +
                    "Best regards,\n" +
                    "RecruitIQ Recruiting Team";
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            content = "Dear " + candidateName + ",\n\n" +
                    "Thank you for your interest in the \"" + jobTitle + "\" position and for taking the time to interview with us.\n\n" +
                    "After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\n" +
                    (hrNotes != null && !hrNotes.trim().isEmpty() ? "Feedback from HR:\n" + hrNotes + "\n\n" : "") +
                    "We will keep your resume in our database for future opportunities that match your qualifications.\n\n" +
                    "We wish you all the best in your job search.\n\n" +
                    "Best regards,\n" +
                    "RecruitIQ Recruiting Team";
        } else if ("ON_HOLD".equalsIgnoreCase(status)) {
            content = "Dear " + candidateName + ",\n\n" +
                    "We wanted to update you on your application for the \"" + jobTitle + "\" position.\n\n" +
                    "Your application is currently on hold as we review all candidates.\n\n" +
                    (hrNotes != null && !hrNotes.trim().isEmpty() ? "HR Notes:\n" + hrNotes + "\n\n" : "") +
                    "We will keep you informed of any updates.\n\n" +
                    "Best regards,\n" +
                    "RecruitIQ Recruiting Team";
        } else {
            // Do not send email for PENDING or any other status
            return;
        }

        log.info("--------------------------------------------------");
        log.info("DECISION EMAIL REQUESTED FOR: {} (Status: {})", toEmail, status);
        log.info("--------------------------------------------------");

        System.out.println("==================================================");
        System.out.println(">>> RecruitIQ Application Status Update for " + toEmail + " (" + status + ") <<<");
        System.out.println(content);
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
            log.info("Decision email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {} via SMTP: {}. Falling back to console logging.", toEmail, e.getMessage());
        }
    }
}
