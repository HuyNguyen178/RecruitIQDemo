package com.recruitiq.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private MailService mailService;

    @Test
    void sendOtpEmail_shouldSendMailWhenSenderIsConfigured() {
        mailService.sendOtpEmail("candidate@example.com", "123456");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetEmail_shouldSendMailWhenSenderIsConfigured() {
        mailService.sendPasswordResetEmail("candidate@example.com", "https://example.com/reset");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendDecisionEmail_shouldSkipWhenStatusIsPending() {
        mailService.sendDecisionEmail("candidate@example.com", "Alice", "Developer", "PENDING", "Keep going");

        verifyNoInteractions(mailSender);
    }
}
