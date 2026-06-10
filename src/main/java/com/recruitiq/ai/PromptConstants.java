package com.recruitiq.ai;

public final class PromptConstants {

    private PromptConstants() {}

    public static final String PARSE_SYSTEM_PROMPT =
            "You are an expert CV/resume parser. Your task is to extract structured information from resumes and CVs. " +
                    "Always respond with valid JSON only. Do not include any explanatory text outside the JSON structure. " +
                    "If a field is not found, use null or an empty array as appropriate. " +
                    "Normalize education levels to one of: HIGH_SCHOOL, BACHELOR, MASTER, PHD.";

    public static final String PARSE_USER_PROMPT_TEMPLATE =
            "Parse the following CV/resume text and extract structured information. " +
                    "Return a JSON object with exactly these fields:\n" +
                    "{\n" +
                    "  \"full_name\": \"string or null\",\n" +
                    "  \"email\": \"string or null\",\n" +
                    "  \"phone\": \"string or null\",\n" +
                    "  \"location\": \"string or null\",\n" +
                    "  \"skills\": [\"array of skill strings\"],\n" +
                    "  \"years_experience\": number or null,\n" +
                    "  \"education_level\": \"HIGH_SCHOOL|BACHELOR|MASTER|PHD or null\",\n" +
                    "  \"education_history\": [\n" +
                    "    {\"degree\": \"string\", \"institution\": \"string\", \"year\": \"string\", \"field\": \"string\"}\n" +
                    "  ],\n" +
                    "  \"work_experience\": [\n" +
                    "    {\"title\": \"string\", \"company\": \"string\", \"start_date\": \"string\", \"end_date\": \"string\", \"description\": \"string\"}\n" +
                    "  ],\n" +
                    "  \"certifications\": [\"array of certification strings\"],\n" +
                    "  \"languages\": [\"array of language strings\"],\n" +
                    "  \"summary\": \"string or null\"\n" +
                    "}\n\n" +
                    "CV Text:\n{raw_cv_text}";

    public static final String SCORE_SYSTEM_PROMPT =
            "You are an expert HR analyst specializing in candidate evaluation. " +
                    "Your task is to objectively score a candidate against a job description on five criteria. " +
                    "Always respond with valid JSON only. Be highly objective, critical, and consistent in your scoring. " +
                    "Do not be overly generous; actively look for gaps and penalize heavily for missing requirements. " +
                    "Each score must be an integer between 0 and 100.";

    public static final String SCORE_USER_PROMPT_TEMPLATE =
            "Score the following candidate against the job description based on five criteria. " +
                    "To prevent score inflation, use a DEDUCTIVE (gap-based) approach: start at 100 and subtract points for every missing or weak requirement.\n\n" +
                    "CRITICAL SCORING RUBRIC:\n" +
                    "1. Experience Score (0-100):\n" +
                    "   - 90-100: Meets or exceeds the required years of professional, production-level experience. Demonstrates senior leadership or measurable impact.\n" +
                    "   - 70-89: Mid-level experience. Operates independently with required tech stack but has minor domain gaps.\n" +
                    "   - 50-69: Junior/Fresher level. Experience consists mostly of academic projects, internships, or is short of the required years in the JD.\n" +
                    "   - Under 50: Little to no relevant professional experience.\n" +
                    "   *MANDATORY RULE:* If the candidate has 0-1 years of actual working experience or is a student/fresher, the experience_score MUST NOT exceed 65, regardless of skill alignment.\n\n" +
                    "2. Skills Score (0-100): Subtract 15-20 points for each core/must-have technical skill missing from the CV.\n\n" +
                    "Return a JSON object with EXACTLY this structure:\n" +
                    "{\n" +
                    "  \"total_score\": number (0-100, mathematically calculated weighted average),\n" +
                    "  \"skills_score\": number (0-100),\n" +
                    "  \"experience_score\": number (0-100),\n" +
                    "  \"education_score\": number (0-100),\n" +
                    "  \"cert_score\": number (0-100),\n" +
                    "  \"soft_skills_score\": number (0-100),\n" +
                    "  \"evidence\": {\n" +
                    "    \"skills_present\": [\"core skills matched in CV\"],\n" +
                    "    \"skills_gaps\": [\"required skills missing or weak\"],\n" +
                    "    \"actual_years_of_experience\": \"summary of candidate's actual employment years found in CV\"\n" +
                    "  },\n" +
                    "  \"reasoning\": {\n" +
                    "    \"skills\": \"detailed critical justification for skills score\",\n" +
                    "    \"experience\": \"explicit reasoning emphasizing actual job tenure vs JD requirements\",\n" +
                    "    \"education\": \"detailed reasoning for education score\",\n" +
                    "    \"certifications\": \"detailed reasoning for certification score\",\n" +
                    "    \"soft_skills\": \"detailed reasoning for soft skills score\",\n" +
                    "    \"overall\": \"overall assessment summary\"\n" +
                    "  }\n" +
                    "}\n\n" +
                    "Scoring weights: Skills 35%, Experience 30%, Education 15%, Certifications 10%, Soft Skills 10%.\n\n" +
                    "Job Description:\n{jd_text}\n\n" +
                    "Candidate Profile:\n{parsed_profile_json}";

    public static final String SUMMARY_SYSTEM_PROMPT =
            "You are an expert HR analyst. Your task is to provide a concise, professional summary of a candidate's fit " +
                    "for a specific role. Be highly objective and realistic, highlighting strengths and explicit gaps. " +
                    "Always respond with valid JSON only.";

    public static final String SUMMARY_USER_PROMPT_TEMPLATE =
            "Based on the job description and candidate profile below, provide a professional assessment. " +
                    "Ensure the recommendation strictly aligns with the total score.\n\n" +
                    "Return a JSON object with exactly this structure:\n" +
                    "{\n" +
                    "  \"summary\": \"A 3-5 sentence professional summary of the candidate's fit for this role, mentioning seniority fit\",\n" +
                    "  \"strengths\": [\"list of 3-5 key strengths relevant to the role\"],\n" +
                    "  \"gaps\": [\"list of 1-3 notable gaps, missing technologies, or lack of commercial experience\"],\n" +
                    "  \"recommendation\": \"STRONG_MATCH|POTENTIAL_MATCH|NOT_RECOMMENDED\",\n" +
                    "  \"recommendation_reason\": \"One sentence explanation of the recommendation\"\n" +
                    "}\n\n" +
                    "Use these recommendation criteria:\n" +
                    "- STRONG_MATCH: Candidate meets or exceeds most requirements, total score >= 75\n" +
                    "- POTENTIAL_MATCH: Candidate meets core requirements with some gaps, total score 50-74\n" +
                    "- NOT_RECOMMENDED: Candidate has significant gaps in key requirements, total score < 50\n\n" +
                    "Job Description:\n{jd_text}\n\n" +
                    "Candidate Profile:\n{parsed_profile_json}";
}