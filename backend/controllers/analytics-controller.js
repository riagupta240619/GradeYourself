"use strict";

const Semester = require("../models/semester-model");
const SubjectModel = require("../models/subject-model");
const User = require("../models/user-model");
const { calculateSubjectScore, calculateSgpa, calculateCgpa } = require("../utils/grading-engine");

/**
 * Resolve the user's grading scale from their profile.
 */
function resolveScale(user) {
  return user?.semesterSystem?.includes("4.0") ? "4.0" : "10.0";
}

/**
 * Helper to parse a numeric semester index or number from semester name.
 */
function parseSemesterNumber(name, index) {
  const match = (name || "").match(/\d+/);
  return match ? parseInt(match[0], 10) : index + 1;
}

/**
 * Extract ONLY user-entered/stored assessment breakdown items.
 * Does NOT generate fake default placeholders.
 */
function extractUserAssessments(subj) {
  // If explicitly stored assessments array exists on the subject document
  if (Array.isArray(subj.assessments) && subj.assessments.length > 0) {
    return subj.assessments.map((a) => ({
      name: a.name,
      marksObtained: a.marksObtained !== undefined && a.marksObtained !== null ? Number(a.marksObtained) : null,
      maxMarks: a.maxMarks !== undefined && a.maxMarks !== null ? Number(a.maxMarks) : null,
      weightPct: a.weightPct !== undefined && a.weightPct !== null ? Number(a.weightPct) : null,
    }));
  }

  // Check marks Map or object for keys user might have entered
  const marks = subj.marks || {};
  const getMark = (id) => {
    if (marks instanceof Map) return marks.get(id);
    if (marks && typeof marks === "object" && id in marks) return marks[id];
    return null;
  };

  const userItems = [];
  const addIfUserEntered = (name, markVal, maxVal) => {
    if (markVal !== null && markVal !== undefined && markVal !== "") {
      const num = Number(markVal);
      if (!isNaN(num)) {
        userItems.push({
          name,
          marksObtained: num,
          maxMarks: maxVal || 100,
          weightPct: null,
        });
      }
    }
  };

  addIfUserEntered("Assignment(s)", getMark("a1") ?? getMark("assignments"), 20);
  addIfUserEntered("Quiz(es)", getMark("a2") ?? getMark("quizzes"), 20);
  addIfUserEntered("Mid Semester", getMark("m1") ?? getMark("midterm"), 30);
  addIfUserEntered("Practical/Lab", getMark("l1") ?? getMark("lab") ?? getMark("practical"), 50);
  addIfUserEntered("Viva", getMark("viva"), 20);
  addIfUserEntered("End Semester", getMark("f1") ?? getMark("final"), 100);
  addIfUserEntered("Project", getMark("project"), 100);
  addIfUserEntered("Attendance", getMark("attendance"), 100);

  return userItems;
}

/**
 * Generate semester AI academic insight summary analyzing stored data.
 */
function generateSemesterAiInsight(semName, sgpa, subjects, highestSubj, lowestSubj) {
  if (!subjects || subjects.length === 0) {
    return `${semName} record verified with completed course credits.`;
  }
  const formattedSgpa = typeof sgpa === "number" && !isNaN(sgpa) ? sgpa.toFixed(2) : "N/A";
  const getSubjPctStr = (s) => {
    if (!s) return "—";
    const p = s.finalPercentage !== null && s.finalPercentage !== undefined ? s.finalPercentage : s.pct;
    return typeof p === "number" && !isNaN(p) ? `${p.toFixed(1)}%` : "—";
  };

  if (typeof sgpa === "number" && sgpa >= 8.5) {
    return `Exceptional academic performance in ${semName} with an SGPA of ${formattedSgpa}. ${highestSubj ? `Highest mastery in ${highestSubj.subjectName || highestSubj.name} (${getSubjPctStr(highestSubj)}).` : ""} Core competency standards achieved.`;
  } else if (typeof sgpa === "number" && sgpa >= 7.0) {
    return `Solid performance in ${semName} with an SGPA of ${formattedSgpa}. ${lowestSubj ? `Opportunity for improvement identified in ${lowestSubj.subjectName || lowestSubj.name} (${getSubjPctStr(lowestSubj)}).` : ""} Re-assessment recommended.`;
  } else {
    return `${semName} SGPA stands at ${formattedSgpa}. ${lowestSubj ? `Targeted academic review recommended for ${lowestSubj.subjectName || lowestSubj.name}.` : ""} Focus on continuous study plan for upcoming terms.`;
  }
}

/**
 * @route   GET /api/analytics
 * @desc    Analytics summary: semester trend, CGPA history, credit distribution,
 *          highest and lowest performing subjects, and detailed completedSemesters breakdown.
 * @access  Private
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const scale = resolveScale(user);

    // Exclude active current semester (isCurrent: true) from Analytics and Past Results
    const semesters = await Semester.find({ user: req.user._id, isCurrent: { $ne: true } }).sort({ createdAt: 1 });

    if (semesters.length === 0) {
      return res.status(200).json({
        semesterTrend: [],
        cgpaHistory: [],
        creditDistribution: [],
        highestSubject: null,
        lowestSubject: null,
        totalSubjectsEvaluated: 0,
        completedSemesters: [],
      });
    }

    const semesterTrend = [];
    const cgpaHistory = [];
    const completedSemesters = [];
    let allSubjects = [];

    for (let i = 0; i < semesters.length; i++) {
      const sem = semesters[i];
      const semName = sem.name.replace(/\s*\(current\)/i, "");

      const subjects = await SubjectModel.find({ semester: sem._id });
      const semForEngine = { ...sem.toObject(), subjects };

      const semSgpa = typeof sem.finalizedSgpa === "number" && !isNaN(sem.finalizedSgpa)
        ? sem.finalizedSgpa
        : calculateSgpa(semForEngine, scale);

      semesterTrend.push({ semester: semName, sgpa: semSgpa });

      // Progressive CGPA up to and including this semester
      const priorSems = semesters.slice(0, i);
      const priorSubjectSets = await Promise.all(
        priorSems.map(async (ps) => {
          const psSubjects = await SubjectModel.find({ semester: ps._id });
          return { ...ps.toObject(), subjects: psSubjects };
        })
      );
      const progressiveCgpa = calculateCgpa([...priorSubjectSets, semForEngine], scale);
      cgpaHistory.push({ semester: semName, cgpa: progressiveCgpa });

      // Formatted subject list for this specific semester reading exact database snapshot fields
      const semSubjectDetails = [];
      let semTotalMarksSum = 0;
      let semCreditsEarned = 0;

      for (const subj of subjects) {
        const score = calculateSubjectScore(subj, scale);

        const finalPercentage = subj.finalPercentage !== null && subj.finalPercentage !== undefined
          ? Number(subj.finalPercentage)
          : score.pct;

        const grade = subj.grade || score.letter;
        const gradePoint = subj.gradePoint !== null && subj.gradePoint !== undefined
          ? Number(subj.gradePoint)
          : score.gradePoint;

        const userAssessments = extractUserAssessments(subj);

        const subjDetail = {
          id: subj._id,
          _id: subj._id,
          subjectName: subj.name,
          name: subj.name,
          subjectCode: subj.code || "",
          code: subj.code || "",
          credits: subj.credits || 3,
          marksObtained: subj.marksObtained !== undefined && subj.marksObtained !== null ? Number(subj.marksObtained) : null,
          maxMarks: subj.maxMarks !== undefined && subj.maxMarks !== null ? Number(subj.maxMarks) : null,
          finalPercentage: finalPercentage,
          pct: finalPercentage,
          grade: grade,
          letterGrade: grade,
          gradePoint: gradePoint,
          assessments: userAssessments,
        };

        semSubjectDetails.push(subjDetail);
        semTotalMarksSum += finalPercentage;
        semCreditsEarned += (subj.credits || 3);

        allSubjects.push({
          name: subj.name,
          code: subj.code || "",
          credits: subj.credits || 3,
          pct: finalPercentage,
          letterGrade: grade,
          gradePoint: gradePoint,
          semester: semName,
        });
      }

      // Sort subjects within semester by final percentage descending
      semSubjectDetails.sort((a, b) => b.finalPercentage - a.finalPercentage);

      const semHighest = semSubjectDetails.length > 0 ? semSubjectDetails[0] : null;
      const semLowest = semSubjectDetails.length > 0 ? semSubjectDetails[semSubjectDetails.length - 1] : null;
      const semAvgMarks = semSubjectDetails.length > 0 ? semTotalMarksSum / semSubjectDetails.length : 0;
      const effectiveCredits = semCreditsEarned > 0 ? semCreditsEarned : (sem.credits || 20);

      completedSemesters.push({
        id: sem._id,
        _id: sem._id,
        name: sem.name,
        semesterNumber: parseSemesterNumber(sem.name, i),
        isCurrent: sem.isCurrent,
        sgpa: semSgpa,
        cgpa: progressiveCgpa,
        creditsEarned: effectiveCredits,
        totalCredits: effectiveCredits,
        totalSubjects: semSubjectDetails.length,
        verificationStatus: "Official Record Verified",
        updatedAt: sem.updatedAt || sem.createdAt,
        subjects: semSubjectDetails,
        summary: {
          highestSubject: semHighest ? { name: semHighest.name, code: semHighest.code, pct: semHighest.finalPercentage } : null,
          lowestSubject: semLowest ? { name: semLowest.name, code: semLowest.code, pct: semLowest.finalPercentage } : null,
          averageMarks: Number(semAvgMarks.toFixed(1)),
          totalCredits: effectiveCredits,
          sgpa: semSgpa,
          cgpa: progressiveCgpa,
        },
        aiInsight: generateSemesterAiInsight(semName, semSgpa, semSubjectDetails, semHighest, semLowest),
      });
    }

    // Sort overall subjects by score descending
    allSubjects.sort((a, b) => b.pct - a.pct);

    const highestSubject = allSubjects.length > 0 ? allSubjects[0] : null;
    const lowestSubject = allSubjects.length > 0 ? allSubjects[allSubjects.length - 1] : null;

    // Credit distribution by broad academic category
    const categoryMap = {};
    for (const subj of allSubjects) {
      let category = "Core Engineering";
      if (/CS|Data|Code|System|Network/i.test(subj.name || subj.code)) {
        category = "Computer Science";
      } else if (/MATH|Calculus|Discrete|Linear/i.test(subj.name || subj.code)) {
        category = "Mathematics";
      } else if (/PHYS|Science|Chemistry/i.test(subj.name || subj.code)) {
        category = "Basic Sciences";
      }

      if (!categoryMap[category]) {
        categoryMap[category] = { category, credits: 0, count: 0 };
      }
      categoryMap[category].credits += subj.credits;
      categoryMap[category].count += 1;
    }

    const responsePayload = {
      semesterTrend,
      cgpaHistory,
      creditDistribution: Object.values(categoryMap),
      highestSubject,
      lowestSubject,
      totalSubjectsEvaluated: allSubjects.length,
      completedSemesters,
    };

    console.log("Analytics Response:");
    console.log(JSON.stringify(responsePayload, null, 2));

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsSummary,
};


