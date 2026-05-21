package com.recruitiq.event;

import lombok.Getter;

@Getter
public class CandidateUploadedEvent {
    private final Long candidateId;

    public CandidateUploadedEvent(Long candidateId) {
        this.candidateId = candidateId;
    }
}