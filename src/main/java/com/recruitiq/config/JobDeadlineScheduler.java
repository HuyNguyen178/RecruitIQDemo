package com.recruitiq.config;

import com.recruitiq.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobDeadlineScheduler {

    private final JobService jobService;

    /** Runs daily at 00:05 server time to close jobs past their deadline. */
    @Scheduled(cron = "0 5 0 * * *")
    public void closeExpiredJobs() {
        int closed = jobService.closeExpiredJobs();
        if (closed > 0) {
            log.debug("Scheduled job deadline check closed {} position(s)", closed);
        }
    }
}
