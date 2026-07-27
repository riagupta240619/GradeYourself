"use strict";

/**
 * AI Academic Document Understanding Controller.
 * Invokes Gemini 2.5 Flash / 1.5 Flash LLM to semantically understand academic transcripts
 * without using hardcoded column positions, regexes, or parsing templates.
 */

const SYSTEM_PROMPT = `
You are an expert Academic Document Understanding AI specializing in university transcripts.
Your job is to read raw text from university transcripts and understand its structure hierarchically.

PRODUCTION ACCURACY RULES:
1. SEMESTER HEADINGS ONLY USING STRICT SEMANTIC CONTEXT:
   - Recognize explicit headers like "Semester 1", "Semester I", "1st Semester", "I Semester", "SEM 1", "SEM II", "Term 1", "Term I".
   - Semester numbers MUST be valid numbers between 1 and 12.
   - NEVER interpret subject codes (e.g. 24CSE0214, CS101), registration/roll numbers (e.g. 2110991001), serial numbers (e.g. S.No 1), years (e.g. 2024), total marks (200, 300), or credit values as semester numbers.
2. GRADE 'O' PRESERVATION:
   - Grade 'O' (Outstanding) is a valid university grade. NEVER convert or default 'O' to 'A'.
3. NO GUESSING CREDITS:
   - Extract exact numeric credits. If unparsed or missing, set credits to null. NEVER invent default values.
4. STUDY PERIOD SEPARATION:
   - Remove study period text ("1 SEM", "2 SEM", "SEM 1") from subject names. Keep full course titles intact without cutoff.
5. STATUS COLUMN STRICTNESS:
   - Do NOT populate "status" unless the transcript explicitly contains a Result/Status column.
6. TOTAL SEMESTER CREDITS:
   - Total credits = sum of extracted subject credits. Do not hallucinate total.

SCHEMA:
{
  "university": "Name of University if found or empty string",
  "institution": "Name of College/Institute if found or empty string",
  "program": "Degree / Course / Program (e.g. B.Tech Computer Science) if found or empty string",
  "department": "Department if found or empty string",
  "semesters": [
    {
      "semester": 1,
      "semesterName": "Semester 1",
      "sgpa": 8.5,
      "cgpa": 8.5,
      "credits": 20,
      "subjects": [
        {
          "code": "24CSE0214",
          "name": "Backend Engineering-I",
          "credits": 3,
          "grade": "O",
          "status": null,
          "remarks": ""
        }
      ]
    }
  ]
}
`;

const parseTranscriptWithAi = async (req, res, next) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
      res.status(400);
      throw new Error("rawText is required for AI document understanding");
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: "No Gemini API key configured on server. Handing over to zero-shot semantic reconstructor.",
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `RAW TRANSCRIPT TEXT TO PARSE:\n\n${rawText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API request failed:", response.status, errText);
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: `Gemini API responded with status ${response.status}. Using zero-shot fallback.`,
      });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: "Empty response from Gemini LLM. Using zero-shot fallback.",
      });
    }

    const cleanedText = candidateText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return res.status(200).json({
      success: true,
      useLocalFallback: false,
      parsedData,
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(200).json({
      success: false,
      useLocalFallback: true,
      error: error.message,
    });
  }
};

module.exports = {
  parseTranscriptWithAi,
};
