package com.recruitiq.service.ai;

public final class JsonResponseExtractor {

    private JsonResponseExtractor() {
    }

    public static String extractJson(String response) {
        if (response == null || response.isBlank()) {
            return "{}";
        }

        String trimmedResponse = response.trim();

        if (trimmedResponse.contains("```json")) {
            int start = trimmedResponse.indexOf("```json") + 7;
            int end = trimmedResponse.lastIndexOf("```");
            if (end > start) {
                trimmedResponse = trimmedResponse.substring(start, end).trim();
            }
        } else if (trimmedResponse.contains("```")) {
            int start = trimmedResponse.indexOf("```") + 3;
            int end = trimmedResponse.lastIndexOf("```");
            if (end > start) {
                trimmedResponse = trimmedResponse.substring(start, end).trim();
            }
        }

        int startIndex = findFirstJsonStart(trimmedResponse);
        if (startIndex < 0) {
            return "{}";
        }

        StringBuilder recovered = new StringBuilder();
        boolean inString = false;
        boolean escaped = false;
        int depthObject = 0;
        int depthArray = 0;
        boolean hasJsonContent = false;

        for (int i = startIndex; i < trimmedResponse.length(); i++) {
            char current = trimmedResponse.charAt(i);

            if (inString) {
                recovered.append(current);
                if (escaped) {
                    escaped = false;
                } else if (current == '\\') {
                    escaped = true;
                } else if (current == '"') {
                    inString = false;
                }
                continue;
            }

            if (current == '"') {
                inString = true;
                recovered.append(current);
                continue;
            }

            if (current == '{') {
                depthObject++;
                hasJsonContent = true;
                recovered.append(current);
                continue;
            }

            if (current == '}') {
                if (depthObject > 0) {
                    depthObject--;
                }
                recovered.append(current);
                continue;
            }

            if (current == '[') {
                depthArray++;
                hasJsonContent = true;
                recovered.append(current);
                continue;
            }

            if (current == ']') {
                if (depthArray > 0) {
                    depthArray--;
                }
                recovered.append(current);
                continue;
            }

            recovered.append(current);
        }

        if (!hasJsonContent) {
            return "{}";
        }

        while (depthObject > 0 || depthArray > 0) {
            if (depthObject > 0) {
                recovered.append('}');
                depthObject--;
            }
            if (depthArray > 0) {
                recovered.append(']');
                depthArray--;
            }
        }

        return recovered.toString().trim();
    }

    private static int findFirstJsonStart(String response) {
        int firstBrace = response.indexOf('{');
        int firstBracket = response.indexOf('[');

        if (firstBrace < 0 && firstBracket < 0) {
            return -1;
        }

        if (firstBrace < 0) {
            return firstBracket;
        }

        if (firstBracket < 0) {
            return firstBrace;
        }

        return Math.min(firstBrace, firstBracket);
    }
}
