"use strict";

const InterviewQuestion = require("../models/interview-model");
const Favorite = require("../models/favorite-model");

// Curated seed questions to bootstrap each student with standard question categories
const SEED_QUESTIONS = [
  // Technical - DSA
  {
    question: "How do you detect a cycle in a linked list with O(1) memory?",
    answer: "Use Floyd's Cycle-Finding Algorithm (Tortoise and Hare).",
    explanation:
      "Initialize two pointers: slow and fast. Move slow by 1 step and fast by 2 steps. If slow meets fast, a cycle exists. If fast reaches null, no cycle exists.",
    category: "Data Structures",
    topic: "Linked Lists",
    difficulty: "Easy",
    company: "Google",
    role: "Software Engineer",
    type: "technical",
    source: "LeetCode 141",
    sourceUrl: "https://leetcode.com/problems/linked-list-cycle/",
    problemUrl: "https://leetcode.com/problems/linked-list-cycle/",
  },
  {
    question: "Explain the difference between Dijkstra's Algorithm and Bellman-Ford.",
    answer:
      "Dijkstra is a greedy algorithm with O((V + E) log V) time that works only with non-negative edge weights. Bellman-Ford uses dynamic programming with O(V * E) time and handles negative edge weights while detecting negative weight cycles.",
    explanation:
      "Dijkstra cannot handle negative edge weights because greedy choices cannot be undone. Bellman-Ford relaxes all edges V-1 times.",
    category: "Algorithms",
    topic: "Graph Theory",
    difficulty: "Medium",
    company: "Amazon",
    role: "Software Engineer",
    type: "technical",
    source: "GeeksforGeeks",
    sourceUrl: "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/",
    problemUrl: "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/",
  },
  // Technical - DBMS
  {
    question: "What are ACID properties and what are database isolation levels?",
    answer:
      "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation levels in SQL include Read Uncommitted, Read Committed, Repeatable Read, and Serializable.",
    explanation:
      "Each level protects against specific concurrency phenomena: Dirty Reads, Non-Repeatable Reads, and Phantom Reads.",
    category: "DBMS",
    topic: "Transactions & Concurrency",
    difficulty: "Medium",
    company: "Microsoft",
    role: "Software Engineer",
    type: "technical",
    source: "Standard Database Systems",
    sourceUrl: "https://en.wikipedia.org/wiki/ACID",
  },
  // Technical - OS
  {
    question: "Explain the four necessary conditions for Deadlock and how to prevent it.",
    answer:
      "The Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
    explanation:
      "Deadlock can be prevented by invalidating at least one of these conditions (e.g. strict ordering of resources prevents circular wait).",
    category: "Operating Systems",
    topic: "Process Synchronization",
    difficulty: "Medium",
    company: "Google",
    role: "Software Engineer",
    type: "technical",
    source: "Silberschatz OS Concepts",
    sourceUrl: "https://en.wikipedia.org/wiki/Deadlock_(computer_science)",
  },
  // Technical - Computer Networks
  {
    question: "Describe what happens from typing a URL in the browser to page render.",
    answer:
      "DNS resolution -> TCP 3-way handshake -> TLS handshake -> HTTP GET request -> Server processing -> Response delivery -> Browser DOM/CSSOM construction & rendering.",
    explanation:
      "Covers application layer (DNS, HTTP), transport layer (TCP/TLS), network layer (IP routing), and browser rendering engines.",
    category: "Computer Networks",
    topic: "Web Protocols",
    difficulty: "Medium",
    company: "Meta",
    role: "Software Engineer",
    type: "technical",
    source: "High Performance Browser Networking",
    sourceUrl: "https://hpbn.co/",
  },
  // Technical - System Design
  {
    question: "How would you design a URL shortener like TinyURL / bit.ly?",
    answer:
      "Key components: API gateway, hash generation (Base62 with Counter/KGS or MD5), RDBMS/NoSQL storage (id, shortKey, longUrl, createdAt), caching (Redis LRU cache for 20% hot URLs), and rate limiting.",
    explanation:
      "Base62 encoding of a 64-bit integer produces 7-character URLs capable of representing 62^7 = 3.5 trillion unique URLs.",
    category: "System Design",
    topic: "Distributed Key-Value & Caching",
    difficulty: "Hard",
    company: "Uber",
    role: "Backend Engineer",
    type: "technical",
    source: "System Design Primer",
    sourceUrl: "https://github.com/donnemartin/system-design-primer",
  },
  // Behavioral - STAR
  {
    question: "Tell me about a time when you had to resolve a conflict within your team.",
    category: "Behavioral",
    topic: "Conflict Resolution",
    difficulty: "Medium",
    company: "Amazon",
    role: "Software Engineer",
    type: "behavioral",
    source: "Amazon Leadership Principles",
    sourceUrl: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
    starResponse: {
      situation:
        "During our semester capstone project, our frontend and backend leads disagreed strongly on whether to use REST or GraphQL.",
      task:
        "As team coordinator, I needed to resolve the deadlock within 48 hours without compromising team morale or delivery timelines.",
      action:
        "I organized a time-boxed spike where we prototyped both architectures against our mobile client requirements and evaluated them on caching simplicity and developer velocity.",
      result:
        "We collectively agreed on REST with typed OpenAPI specs, delivered the MVP 4 days ahead of schedule, and scored top marks.",
    },
  },
  {
    question: "Describe a significant failure or mistake you made and how you handled it.",
    category: "Behavioral",
    topic: "Failure & Accountability",
    difficulty: "Medium",
    company: "Google",
    role: "Software Engineer",
    type: "behavioral",
    source: "Google Interview Guide",
    sourceUrl: "https://careers.google.com/how-we-hire/",
    starResponse: {
      situation:
        "While deploying an update to our college society portal, I pushed a database migration that dropped an active session table.",
      task:
        "I needed to restore service immediately, recover session tokens, and prevent future unvalidated schema changes.",
      action:
        "I rolled back the deployment within 5 minutes using our git tag fallback, ran a restore script from the hourly backup, and implemented automated schema validation in GitHub Actions CI.",
      result:
        "Downtime was limited to under 8 minutes with zero data loss, and our CI pipeline prevented 3 subsequent schema accidents.",
    },
  },
  // Coding Questions Tracker
  {
    question: "Two Sum",
    category: "Algorithms",
    topic: "Arrays & Hash Table",
    difficulty: "Easy",
    company: "Google",
    role: "Software Engineer",
    type: "coding",
    source: "LeetCode",
    sourceUrl: "https://leetcode.com/problems/two-sum/",
    problemUrl: "https://leetcode.com/problems/two-sum/",
    answer: "Use a hash map to look up the complement in O(1) time.",
    explanation: "Time Complexity: O(n), Space Complexity: O(n).",
  },
  {
    question: "LRU Cache",
    category: "Data Structures",
    topic: "Hash Table & Doubly Linked List",
    difficulty: "Medium",
    company: "Amazon",
    role: "Software Engineer",
    type: "coding",
    source: "LeetCode",
    sourceUrl: "https://leetcode.com/problems/lru-cache/",
    problemUrl: "https://leetcode.com/problems/lru-cache/",
    answer: "Combine a hash map with a doubly linked list for O(1) get and put.",
    explanation: "Nodes are moved to the head on access and evicted from the tail.",
  },
];

const { VETTED_INTERVIEW_QUESTIONS } = require("../services/resources/interviewCurator");

/**
 * Ensures user has all authentic, vetted questions seeded from Cracking the Coding Interview,
 * standard CS textbooks (OS, DBMS, Networks, System Design), and real company sources.
 */
async function ensureSeedQuestions(userId) {
  const existing = await InterviewQuestion.find({ user: userId }, { question: 1 }).lean();
  const existingTitles = new Set(existing.map((q) => q.question.trim().toLowerCase()));

  const toInsert = [];
  for (const q of VETTED_INTERVIEW_QUESTIONS) {
    if (!existingTitles.has(q.question.trim().toLowerCase())) {
      toInsert.push({
        ...q,
        user: userId,
        isPersonal: false,
      });
      existingTitles.add(q.question.trim().toLowerCase());
    }
  }

  if (toInsert.length > 0) {
    await InterviewQuestion.insertMany(toInsert);
  }
}

/**
 * POST /api/career/interview-prep/sync
 * Explicitly syncs user's question bank with the authoritative book and curriculum question set.
 */
async function syncCuratedQuestions(req, res, next) {
  try {
    const userId = req.user._id;
    await ensureSeedQuestions(userId);
    const questions = await InterviewQuestion.find({ user: userId }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      message: "Successfully synchronized questions with Cracking the Coding Interview and CS textbook catalogs.",
      totalCount: questions.length,
      questions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/career/interview-prep
 */
async function listQuestions(req, res, next) {
  try {
    const userId = req.user._id;
    await ensureSeedQuestions(userId);

    const { type, category, company, role, status, difficulty, isFavorite, search } =
      req.query;

    const query = { user: userId };
    if (type) query.type = type;
    if (category) query.category = category;
    if (company && company !== "all") query.company = company;
    if (role && role !== "all") query.role = role;
    if (status && status !== "all") query.status = status;
    if (difficulty && difficulty !== "all") query.difficulty = difficulty;
    if (isFavorite === "true") query.isFavorite = true;

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const questions = await InterviewQuestion.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/career/interview-prep
 */
async function createQuestion(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      question,
      answer,
      explanation,
      category,
      topic,
      difficulty,
      company,
      role,
      type,
      starResponse,
      source,
      sourceUrl,
      problemUrl,
      status,
      notes,
    } = req.body;

    if (!question || !question.trim()) {
      res.status(400);
      throw new Error("Question text is required");
    }

    const created = await InterviewQuestion.create({
      user: userId,
      question: question.trim(),
      answer: (answer || "").trim(),
      explanation: (explanation || "").trim(),
      category: category || "Data Structures",
      topic: (topic || "").trim(),
      difficulty: difficulty || "Medium",
      company: (company || "General").trim(),
      role: (role || "Software Engineer").trim(),
      type: type || "technical",
      starResponse: starResponse || {},
      source: (source || "Personal").trim(),
      sourceUrl: (sourceUrl || "").trim(),
      problemUrl: (problemUrl || "").trim(),
      status: status || "not_started",
      notes: (notes || "").trim(),
      isPersonal: true,
    });

    res.status(201).json({ question: created });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/career/interview-prep/:id
 */
async function updateQuestion(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const allowed = [
      "question",
      "answer",
      "explanation",
      "category",
      "topic",
      "difficulty",
      "company",
      "role",
      "type",
      "starResponse",
      "source",
      "sourceUrl",
      "problemUrl",
      "status",
      "isPracticed",
      "isConfident",
      "isFavorite",
      "notes",
    ];

    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }

    if (patch.status) {
      if (patch.status === "practicing") patch.isPracticed = true;
      if (patch.status === "confident") {
        patch.isPracticed = true;
        patch.isConfident = true;
      }
    }

    const updated = await InterviewQuestion.findOneAndUpdate(
      { _id: id, user: userId },
      patch,
      { new: true }
    );

    if (!updated) {
      res.status(404);
      throw new Error("Interview question not found");
    }

    // Sync with Universal Favorites
    if (req.body.isFavorite !== undefined) {
      if (req.body.isFavorite) {
        await Favorite.findOneAndUpdate(
          { user: userId, itemType: "interview_question", itemId: String(updated._id) },
          {
            user: userId,
            itemType: "interview_question",
            itemId: String(updated._id),
            title: updated.question,
            category: updated.category,
            description: updated.answer || updated.topic,
            metadata: {
              company: updated.company,
              difficulty: updated.difficulty,
              type: updated.type,
            },
          },
          { upsert: true }
        );
      } else {
        await Favorite.deleteOne({
          user: userId,
          itemType: "interview_question",
          itemId: String(updated._id),
        });
      }
    }

    res.json({ question: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/career/interview-prep/:id
 */
async function deleteQuestion(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await InterviewQuestion.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deleted) {
      res.status(404);
      throw new Error("Interview question not found");
    }

    await Favorite.deleteOne({
      user: userId,
      itemType: "interview_question",
      itemId: id,
    });

    res.json({ message: "Interview question deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/career/interview-prep/progress
 */
async function getProgress(req, res, next) {
  try {
    const userId = req.user._id;
    await ensureSeedQuestions(userId);

    const questions = await InterviewQuestion.find({ user: userId }).lean();

    const technical = questions.filter((q) => q.type === "technical");
    const behavioral = questions.filter((q) => q.type === "behavioral");
    const coding = questions.filter((q) => q.type === "coding");

    const techSolved = technical.filter((q) => q.status !== "not_started").length;
    const behavSolved = behavioral.filter(
      (q) =>
        q.status !== "not_started" ||
        (q.starResponse?.situation && q.starResponse?.action)
    ).length;
    const codingSolved = coding.filter((q) => q.status !== "not_started").length;

    const totalQuestions = questions.length;
    const totalSolved = techSolved + behavSolved + codingSolved;
    const overallProgress =
      totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

    res.json({
      technical: {
        total: technical.length,
        completed: techSolved,
        percentage:
          technical.length > 0 ? Math.round((techSolved / technical.length) * 100) : 0,
      },
      behavioral: {
        total: behavioral.length,
        completed: behavSolved,
        percentage:
          behavioral.length > 0 ? Math.round((behavSolved / behavioral.length) * 100) : 0,
      },
      coding: {
        total: coding.length,
        completed: codingSolved,
        percentage:
          coding.length > 0 ? Math.round((codingSolved / coding.length) * 100) : 0,
      },
      overallProgress,
      totalQuestions,
      totalSolved,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/career/interview-prep/discover
 * Discover publicly available past interview questions & resources for company and role
 */
async function discoverCompanyQuestions(req, res, next) {
  try {
    const { company = "Google", role = "Software Engineer" } = req.query;

    const curatedCompanyCatalog = {
      Google: {
        interviewGuide: "https://careers.google.com/how-we-hire/",
        description:
          "Google technical rounds focus heavily on DSA, algorithmic complexity (O(N) vs O(N log N)), edge cases, and clean scalable code.",
        resources: [
          {
            title: "Google Technical Interview Preparation Guide",
            source: "Official Google Careers",
            url: "https://careers.google.com/how-we-hire/",
            type: "Official Guide",
          },
          {
            title: "Top Google Interview Questions Collection",
            source: "LeetCode Discuss & Problemset",
            url: "https://leetcode.com/company/google/",
            type: "Coding Sheet",
          },
          {
            title: "Google System Design Interview Blueprint",
            source: "GitHub System Design Primer",
            url: "https://github.com/donnemartin/system-design-primer",
            type: "System Design",
          },
        ],
        pastQuestions: [
          {
            question: "Find Median from Data Stream",
            category: "Data Structures",
            topic: "Heaps / Two Heaps Pattern",
            difficulty: "Hard",
            source: "LeetCode 295",
            sourceUrl: "https://leetcode.com/problems/find-median-from-data-stream/",
          },
          {
            question: "Word Ladder II (Shortest Transformation Sequences)",
            category: "Algorithms",
            topic: "BFS + Backtracking",
            difficulty: "Hard",
            source: "LeetCode 126",
            sourceUrl: "https://leetcode.com/problems/word-ladder-ii/",
          },
          {
            question: "Design Google Search Autocomplete / Typeahead",
            category: "System Design",
            topic: "Trie + Distributed Cache + Aggregation",
            difficulty: "Hard",
            source: "System Design Primer",
            sourceUrl: "https://github.com/donnemartin/system-design-primer",
          },
          {
            question: "Tell me about a time when you pushed back on a product requirement.",
            category: "Behavioral",
            topic: "Navigating Ambiguity & Googleyness",
            difficulty: "Medium",
            source: "Google Interview Principles",
            sourceUrl: "https://careers.google.com/how-we-hire/",
          },
        ],
      },
      Microsoft: {
        interviewGuide: "https://careers.microsoft.com/",
        description:
          "Microsoft emphasizes object-oriented design, modularity, dynamic programming, trees, and practical engineering trade-offs.",
        resources: [
          {
            title: "Microsoft Engineering Interview Guidelines",
            source: "Microsoft Careers",
            url: "https://careers.microsoft.com/",
            type: "Official Guide",
          },
          {
            title: "Microsoft Tagged Interview Questions",
            source: "LeetCode",
            url: "https://leetcode.com/company/microsoft/",
            type: "Coding Sheet",
          },
        ],
        pastQuestions: [
          {
            question: "Serialize and Deserialize Binary Tree",
            category: "Data Structures",
            topic: "Tree Traversal / BFS",
            difficulty: "Hard",
            source: "LeetCode 297",
            sourceUrl: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
          },
          {
            question: "Design TinyURL / Distributed Hash Key Service",
            category: "System Design",
            topic: "Hashing & Scalability",
            difficulty: "Medium",
            source: "GeeksforGeeks",
            sourceUrl: "https://www.geeksforgeeks.org/how-to-design-a-tiny-url-or-url-shortener/",
          },
          {
            question: "How do you handle disagreement with a technical decision?",
            category: "Behavioral",
            topic: "Growth Mindset & Collaboration",
            difficulty: "Medium",
            source: "Microsoft Culture & Values",
            sourceUrl: "https://www.microsoft.com/en-us/about/values",
          },
        ],
      },
      Amazon: {
        interviewGuide: "https://www.amazon.jobs/en/principles",
        description:
          "Amazon interviews are 50% Leadership Principles (STAR method is mandatory) and 50% technical coding/system design.",
        resources: [
          {
            title: "Amazon 16 Leadership Principles Walkthrough",
            source: "Official Amazon Jobs",
            url: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
            type: "Official Guide",
          },
          {
            title: "Amazon Curated DSA Questions",
            source: "LeetCode",
            url: "https://leetcode.com/company/amazon/",
            type: "Coding Sheet",
          },
        ],
        pastQuestions: [
          {
            question: "Number of Islands",
            category: "Algorithms",
            topic: "Graph Traversal / DFS",
            difficulty: "Medium",
            source: "LeetCode 200",
            sourceUrl: "https://leetcode.com/problems/number-of-islands/",
          },
          {
            question: "Tell me about a time when you showed Customer Obsession.",
            category: "Behavioral",
            topic: "Customer Obsession (STAR)",
            difficulty: "Medium",
            source: "Amazon Leadership Principles",
            sourceUrl: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
          },
          {
            question: "Design an Amazon Locker Delivery System",
            category: "OOP",
            topic: "Object Oriented Design Patterns",
            difficulty: "Medium",
            source: "GeeksforGeeks",
            sourceUrl: "https://www.geeksforgeeks.org/design-amazon-locker-system/",
          },
        ],
      },
    };

    const targetCompany = curatedCompanyCatalog[company] || curatedCompanyCatalog["Google"];

    res.json({
      company,
      role,
      data: targetCompany,
      availableCompanies: ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Atlassian", "Uber"],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getProgress,
  discoverCompanyQuestions,
  syncCuratedQuestions,
};
