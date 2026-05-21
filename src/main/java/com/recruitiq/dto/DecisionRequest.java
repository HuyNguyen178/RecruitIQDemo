package com.recruitiq.dto;

import com.recruitiq.model.Shortlist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DecisionRequest {
    private Shortlist.DecisionStatus decisionStatus;
    private String hrNotes;
}
