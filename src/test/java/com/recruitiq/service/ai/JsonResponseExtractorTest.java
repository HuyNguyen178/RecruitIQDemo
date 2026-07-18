package com.recruitiq.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonResponseExtractorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void extractJson_shouldRecoverTruncatedJsonWithUnclosedArray() {
        String response = "{\"skills\": [\"Java\", \"Spring\", \"Struts\"";

        String extracted = JsonResponseExtractor.extractJson(response);

        assertDoesNotThrow(() -> objectMapper.readTree(extracted));
        assertTrue(extracted.contains("\"skills\""));
    }

    @Test
    void extractJson_shouldRecoverTruncatedJsonWithUnclosedObject() {
        String response = "{\"reasoning\": {\"skills\": \"good\", \"experience\": \"ok\"";

        String extracted = JsonResponseExtractor.extractJson(response);

        assertDoesNotThrow(() -> objectMapper.readTree(extracted));
        assertTrue(extracted.contains("\"reasoning\""));
    }
}
