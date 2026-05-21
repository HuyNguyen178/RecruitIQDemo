package com.recruitiq.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileDownloadDto {
    private String filePath;
    private String fileName;
}
