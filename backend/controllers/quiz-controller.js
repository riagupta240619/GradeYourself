"use strict";

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { QuizDocument, QuizAttempt } = require("../models/quiz-model");
const StorageFile = require("../models/storage-file-model");

// Common non-topic keywords to avoid treating as concepts
const QUIZ_STOPWORDS = new Set([
  "Answer",
  "Question",
  "Questions",
  "Section",
  "Chapter",
  "Unit",
  "Part",
  "True",
  "False",
  "Page",
  "Http",
  "Https",
  "Figure",
  "Table",
  "Total",
  "Marks",
  "Date",
  "Name",
  "Score",
  "Test",
  "Exam",
  "Option",
  "Choice",
]);

/**
 * Extracts pre-formatted multiple choice questions directly from text if present
 * (e.g., question banks, practice exercises, sample exams)
 */
function parseExistingMCQsFromText(text) {
  const mcqRegex = /(?:^|\n)\s*(\d+[\.\)]\s*[^\n]+)\s*\n+\s*([a-dA-D][\.\)]\s*[^\n]+)\s*\n+\s*([a-dA-D][\.\)]\s*[^\n]+)\s*\n+\s*([a-dA-D][\.\)]\s*[^\n]+)\s*\n+\s*([a-dA-D][\.\)]\s*[^\n]+)(?:\s*\n+\s*Answer:?\s*([a-dA-D])[\)\.]?)?/gi;

  const results = [];
  let match;
  while ((match = mcqRegex.exec(text)) !== null) {
    const rawQuestion = match[1].replace(/^\d+[\.\)]\s*/, "").trim();
    const rawOpts = [match[2], match[3], match[4], match[5]].map((o) =>
      o.replace(/^[a-dA-D][\.\)]\s*/, "").trim()
    );
    const ansLetter = (match[6] || "a").toLowerCase();
    const letterIdx = { a: 0, b: 1, c: 2, d: 3 }[ansLetter] ?? 0;
    const correctAnswer = rawOpts[letterIdx] || rawOpts[0];

    // Infer a section or topic if preceding headers exist
    results.push({
      question: rawQuestion,
      type: "mcq",
      options: rawOpts,
      correctAnswer,
      explanation: `Extracted directly from study document (Answer indicated as ${ansLetter.toUpperCase()}).`,
      topic: "Study Assessment",
      difficulty: "medium",
    });
  }
  return results;
}

// Heuristic NLP Quiz Generator when Gemini API is unconfigured or offline
function generateFallbackQuiz(text, numQuestions = 5, questionTypes = ["mcq", "true_false", "short_answer"], difficulty = "medium") {
  // Check if the document already contains pre-formatted questions
  const preExisting = parseExistingMCQsFromText(text);
  if (preExisting.length >= numQuestions) {
    const questions = preExisting.slice(0, numQuestions);
    const topics = Array.from(new Set(questions.map((q) => q.topic)));
    return { topics, questions };
  }

  // Normalize and clean sentences
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(
      (s) =>
        s.length > 25 &&
        s.length < 220 &&
        !s.includes("http") &&
        !s.includes("Page") &&
        !/^\s*(Answer|Question|Section)\s*:/i.test(s)
    );

  // Extract potential topic keywords excluding stopwords
  const words = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
  const freq = {};
  words.forEach((w) => {
    if (!QUIZ_STOPWORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const sortedTopics = Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 5);
  const topics = sortedTopics.length ? sortedTopics : ["Core Concepts", "Analysis", "Implementation"];

  const questions = [...preExisting];
  const needed = numQuestions - questions.length;
  const definitionRegex = /([A-Z][a-zA-Z\s]{2,25})\s+(?:is|are|refers to|means|defines)\s+([^.]+)/i;

  let sentenceIdx = 0;
  for (let i = 0; i < needed; i++) {
    const type = questionTypes[i % questionTypes.length] || "mcq";
    const currentTopic = topics[i % topics.length] || "Concepts";
    const sentence =
      sentences[sentenceIdx % (sentences.length || 1)] ||
      `Understanding ${currentTopic} is essential for reliable operation and architecture.`;
    sentenceIdx++;

    const match = sentence.match(definitionRegex);
    const rawConcept = match ? match[1].trim() : currentTopic;
    const concept = QUIZ_STOPWORDS.has(rawConcept) ? currentTopic : rawConcept;

    if (type === "mcq") {
      const isDefinition = Boolean(match);
      const questionText = isDefinition
        ? `What is the primary role or definition of ${concept}?`
        : `According to the document, which statement correctly applies to ${concept}?`;

      const correctAnswer = isDefinition
        ? match[2].trim().slice(0, 100)
        : sentence.slice(0, 100);

      // Select dynamic distractors from other sentences in the text
      const candidateDistractors = sentences
        .filter((s) => s !== sentence && s.length > 20)
        .slice(0, 8);

      const wrongOptions = [];
      for (let d = 0; d < 3; d++) {
        if (candidateDistractors[d]) {
          wrongOptions.push(candidateDistractors[d].slice(0, 90));
        } else {
          wrongOptions.push(`It operates inversely without referencing ${concept}.`);
        }
      }

      const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);

      questions.push({
        question: questionText,
        type: "mcq",
        options,
        correctAnswer,
        explanation: `Document context: "${sentence}"`,
        topic: currentTopic,
        difficulty,
      });
    } else if (type === "true_false") {
      const isTrue = i % 2 === 0;
      const statement = isTrue
        ? sentence
        : sentence.replace(/\b(is|are|can|will|must)\b/i, "cannot").slice(0, 150);

      questions.push({
        question: `True or False: "${statement}"`,
        type: "true_false",
        options: ["True", "False"],
        correctAnswer: isTrue ? "True" : "False",
        explanation: `Document context states: "${sentence}"`,
        topic: currentTopic,
        difficulty,
      });
    } else {
      questions.push({
        question: `Explain the key function of ${concept} as outlined in the text.`,
        type: "short_answer",
        options: [],
        correctAnswer: sentence.slice(0, 140),
        explanation: `Key reference from text: "${sentence}"`,
        topic: currentTopic,
        difficulty,
      });
    }
  }

  return { topics, questions };
}

/**
 * Generates quiz with Gemini API if GEMINI_API_KEY is available
 * Tries rolling Gemini models so deprecated version aliases don't break generation.
 */
async function generateQuizWithGemini(extractedText, numQuestions, questionTypes, difficulty) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_gemini")) return null;

  const prompt = `
You are an expert educational examiner. Based on the following study material or exam document, generate a structured quiz.

CRITICAL EXTRACTION & ACCURACY RULES:
1. If the source text contains pre-existing questions, practice tests, or question banks (e.g., question text followed by options like a, b, c, d and an Answer indicator), you MUST EXTRACT AND PRESERVE THOSE EXACT QUESTIONS, OPTIONS, AND DESIGNATED ANSWERS FIRST!
2. When extracting existing options, clean off any leading markers like "a)", "b)", "A.", "B." so each option string in the options array is clean and clear.
3. If the text says "Answer: b)", determine the exact text of option b and set that as "correctAnswer".
4. If there are no pre-existing questions in the text, or if more questions are requested than exist, generate clear, factual questions directly from the contents of the text.
5. Do NOT hallucinate distractors if real choices are already in the source.
6. Do NOT confuse labels like "Answer", "Question", or "Section" as conceptual topics.

Text snippet:
"""
${extractedText.slice(0, 15000)}
"""

REQUIREMENTS:
- Number of questions to return: ${numQuestions}
- Difficulty: ${difficulty}
- Allowed question types: ${questionTypes.join(", ")}
- Identify 2 to 4 major educational topics present in the document.

Return strictly valid JSON with this schema:
{
  "topics": ["Topic 1", "Topic 2"],
  "questions": [
    {
      "question": "Clear question text",
      "type": "mcq" | "true_false" | "short_answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact correct option string",
      "explanation": "Brief explanation referencing the text",
      "topic": "Specific topic",
      "difficulty": "${difficulty}"
    }
  ]
}
`;

  // Candidate models supported on Google Gemini API
  const candidateModels = [
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
  ];

  let lastError = null;
  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        },
        { timeout: 25000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) continue;

      const cleanJson = candidate.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} call notice:`, err.response?.data?.error?.message || err.message);
    }
  }

  console.warn("All Gemini candidate models failed, falling back to heuristic generator:", lastError?.message);
  return null;
}

/**
 * POST /api/quizzes/generate
 * Uploads a PDF or selects from storage, extracts text, and generates quiz
 */
async function generateQuiz(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      fileId,
      title,
      numQuestions = 5,
      questionTypes = "mcq,true_false",
      difficulty = "medium",
      saveToStorage,
    } = req.body;

    let pdfBuffer = null;
    let fileName = "";
    let savedFileId = null;

    if (req.file) {
      pdfBuffer = fs.readFileSync(req.file.path);
      fileName = req.file.originalname;

      // Integration: If user checked "Save uploaded PDF to My Storage"
      if (saveToStorage === "true" || saveToStorage === true) {
        try {
          const storageFile = await StorageFile.create({
            user: userId,
            name: req.file.originalname,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype || "application/pdf",
            size: req.file.size,
            storageKey: req.file.filename,
            provider: "local",
            providerUrl: req.file.path,
          });
          savedFileId = storageFile._id;
        } catch (storageErr) {
          console.warn("Could not save to storage:", storageErr);
        }
      }
    } else if (fileId) {
      const storageFile = await StorageFile.findOne({ _id: fileId, user: userId });
      if (!storageFile) {
        res.status(404);
        throw new Error("File not found in personal storage");
      }
      const filePath =
        storageFile.providerUrl ||
        path.join(__dirname, "../uploads/storage", String(userId), storageFile.storageKey);

      if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error("File binary not found on server");
      }
      pdfBuffer = fs.readFileSync(filePath);
      fileName = storageFile.name;
      savedFileId = storageFile._id;
    } else {
      res.status(400);
      throw new Error("Either a PDF file or a storage fileId is required");
    }

    // Step 2: Extract text via pdf-parse
    let extractedText = "";
    try {
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text || "";
    } catch (parseErr) {
      res.status(422);
      throw new Error("Failed to parse PDF document. Ensure the file contains readable text.");
    }

    if (!extractedText.trim()) {
      res.status(422);
      throw new Error("The PDF does not contain extractable text (it might be scanned images).");
    }

    const typesArr = typeof questionTypes === "string" ? questionTypes.split(",") : questionTypes;
    const count = Math.min(20, Math.max(3, Number(numQuestions) || 5));

    // Step 3: Generate Quiz with Gemini or Fallback
    let generated = await generateQuizWithGemini(extractedText, count, typesArr, difficulty);
    if (!generated || !generated.questions?.length) {
      generated = generateFallbackQuiz(extractedText, count, typesArr, difficulty);
    }

    const quizDoc = await QuizDocument.create({
      user: userId,
      title: (title || fileName.replace(/\.pdf$/i, "") || "Untitled Quiz").trim(),
      sourceFileName: fileName,
      sourceFileId: savedFileId,
      numQuestions: count,
      difficulty,
      topics: generated.topics || [],
      questions: generated.questions || [],
    });

    res.status(201).json({
      quiz: quizDoc,
      message: `Generated ${quizDoc.questions.length} questions from ${fileName}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quizzes/:id/submit
 * Evaluates quiz attempt, calculates score, and identifies strong/weak topics
 */
async function submitAttempt(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { userAnswers } = req.body; // Map: { [questionIndex]: "user answer" }

    const quiz = await QuizDocument.findOne({ _id: id, user: userId });
    if (!quiz) {
      res.status(404);
      throw new Error("Quiz not found");
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const evaluatedAnswers = [];
    const topicStats = {};

    quiz.questions.forEach((q, idx) => {
      const userAns = (userAnswers?.[idx] || userAnswers?.[String(idx)] || "").trim();
      const topic = q.topic || "General";

      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total += 1;

      let isCorrect = false;
      if (q.type === "short_answer") {
        // Generous matching for short answer
        isCorrect = userAns.length > 5;
      } else {
        isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();
      }

      if (isCorrect) {
        score += 1;
        topicStats[topic].correct += 1;
      }

      evaluatedAnswers.push({
        questionIndex: idx,
        questionText: q.question,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic,
      });
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    const strongTopics = [];
    const weakTopics = [];

    Object.entries(topicStats).forEach(([topic, stats]) => {
      const topicPct = (stats.correct / stats.total) * 100;
      if (topicPct >= 70) {
        strongTopics.push(topic);
      } else {
        weakTopics.push(topic);
      }
    });

    const attempt = await QuizAttempt.create({
      user: userId,
      quiz: quiz._id,
      quizTitle: quiz.title,
      score,
      totalQuestions,
      percentage,
      strongTopics,
      weakTopics,
      answers: evaluatedAnswers,
      completedAt: new Date(),
    });

    res.status(201).json({
      attempt,
      score,
      totalQuestions,
      percentage,
      strongTopics,
      weakTopics,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quizzes/history
 */
async function getHistory(req, res, next) {
  try {
    const userId = req.user._id;
    const attempts = await QuizAttempt.find({ user: userId })
      .populate("quiz", "title sourceFileName difficulty")
      .sort({ completedAt: -1 })
      .limit(30)
      .lean();

    res.json({ attempts });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quizzes/:id
 */
async function getQuizById(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const quiz = await QuizDocument.findOne({ _id: id, user: userId }).lean();
    if (!quiz) {
      res.status(404);
      throw new Error("Quiz not found");
    }

    res.json({ quiz });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateQuiz,
  submitAttempt,
  getHistory,
  getQuizById,
};
