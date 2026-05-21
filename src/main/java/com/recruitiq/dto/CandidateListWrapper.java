package com.recruitiq.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

// File: CandidateListWrapper.java
@Data
@Builder
public class CandidateListWrapper {
    private List<CandidateListResponse> candidates;
    private long totalCount;
    private long shortlistedCount;
}
