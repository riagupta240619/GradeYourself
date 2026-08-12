"use strict";

/**
 * AI Academic Document Understanding Controller.
 * Invokes Gemini Multimodal Vision API (or Text API fallback) to understand academic transcripts visually
 * and extract structured academic table data (semesters, subjects, credits, grades) without losing column relationships.
 */

const SYSTEM_PROMPT = `
You are an expert Multimodal Academic Document Understanding AI specializing in university transcripts and mark sheets.
Your task is to analyze document images/PDFs visually, understand their tabular structure, and extract structured academic data.

MULTIMODAL TABLE EXTRACTION INSTRUCTIONS:
1. VISUAL TABLE UNDERSTANDING:
   - Identify visual table borders, column headers, and subject rows.
   - For EVERY subject row in a semester table, preserve the strict 1-to-1 relationship across columns:
     [SUBJECT CODE] | [SUBJECT NAME / TITLE] | [CREDITS] | [GRADE]

2. FIELD EXTRACTION RULES:
   - "code": Extract the exact subject/course code (e.g. "24CAPS101", "24CSE0214", "CS101", "MATH101"). 
     Do NOT put subject title text inside code. Do NOT truncate subject codes.
   - "name": Extract the full, complete subject/course title (e.g. "CALCULUS AND STATISTICAL ANALYSIS", "DATA STRUCTURES USING OBJECT ORIENTED PROGRAMMING").
     Do NOT cut off or truncate long names. Do NOT put code in the name.
   - "credits": Extract exact numeric credits (e.g. 4, 3, 2, 1, 1.5). 
     MUST be a number or null. If missing or unreadable, set to null. NEVER invent default credits or guess values.
   - "grade": Extract the official letter grade (e.g. "O", "A+", "A", "B+", "B", "C+", "C", "D", "P", "F", "I", "S", "U", "PASS", "FAIL").
     Preserve Grade "O" (Outstanding) as letter "O" (never digit 0 or A). If missing or unreadable, set to null.

3. STRICT ACCURACY & INTEGRITY RULES:
   - NEVER invent or hallucinate missing information.
   - NEVER guess a grade or credit if unreadable (use null).
   - NEVER merge two separate subject rows into a single row.
   - NEVER split one subject row into multiple fake subjects.
   - NEVER shift values between columns (e.g., do not put credit numbers in subject code, or subject code in subject name).
   - Recognize semester sections separately ("Semester 1", "Semester 2", "Semester 3", etc.).
   - Extract SGPA and CGPA per semester if explicitly printed in the document; otherwise set to null.
   - Ignore header rows (e.g., "S.No", "Subject Code", "Subject Name", "Credits", "Grade"), disclaimers, signatures, footer notes, and non-subject noise.

RETURN JSON STRICTLY COMPLYING WITH THIS SCHEMA:
{
  "university": "Name of University if visible or empty string",
  "institution": "Name of College/Institute if visible or empty string",
  "program": "Degree / Course / Program (e.g. B.Tech Computer Science) if visible or empty string",
  "department": "Department if visible or empty string",
  "semesters": [
    {
      "semester": 1,
      "semesterName": "Semester 1",
      "sgpa": 8.5,
      "cgpa": 8.5,
      "credits": 20,
      "subjects": [
        {
          "code": "24CAPS101",
          "name": "Calculus and Statistical Analysis",
          "credits": 4,
          "grade": "A",
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
    const { fileData, mimeType, rawText } = req.body;

    if (!fileData && (!rawText || typeof rawText !== "string" || rawText.trim() === "")) {
      res.status(400);
      throw new Error("Either fileData (base64 image/PDF) or rawText is required for AI document understanding");
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: "No Gemini API key configured on server. Handing over to local OCR engine fallback.",
      });
    }

    // Construct Gemini Multimodal / Text parts
    const parts = [{ text: SYSTEM_PROMPT }];

    if (fileData && mimeType) {
      // Strip base64 data URI header prefix if present
      const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64,
        },
      });
      if (rawText) {
        parts.push({ text: `OPTIONAL COMPLEMENTARY OCR TEXT FEED:\n\n${rawText}` });
      }
    } else if (rawText) {
      parts.push({ text: `RAW TRANSCRIPT TEXT TO PARSE:\n\n${rawText}` });
    }

    // Try Gemini Multimodal models
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let response = null;
    let lastErrorMsg = "";

    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const resCall = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (resCall.ok) {
          response = resCall;
          break;
        } else {
          lastErrorMsg = await resCall.text();
          console.warn(`Gemini model ${modelName} status ${resCall.status}:`, lastErrorMsg);
        }
      } catch (err) {
        lastErrorMsg = err instanceof Error ? err.message : String(err);
      }
    }

    if (!response || !response.ok) {
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: `Gemini Multimodal API failed (${lastErrorMsg}). Using local OCR fallback.`,
      });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(200).json({
        success: false,
        useLocalFallback: true,
        message: "Empty response from Gemini LLM. Using local OCR fallback.",
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
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

module.exports = {
  parseTranscriptWithAi,
};
