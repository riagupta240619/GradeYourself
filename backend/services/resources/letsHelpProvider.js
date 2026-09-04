"use strict";

const axios = require("axios");
const { normalizeResource } = require("./resourceNormalizer");

const BASE_URL = process.env.LETSHELP_SOURCE_URL || "https://letshelp.vercel.app";
const TIMEOUT_MS = 6000;

// Subject name normalization mapping to standard curriculum subjects
const SUBJECT_NAME_MAP = {
  "Data Structures and Algorithms": "Data Structures & Algorithms",
  "Database Management System": "Database Management Systems (DBMS)",
  "Operating Systems": "Operating Systems",
  "Computer Networks": "Computer Networks",
  "Problem Solving Using CPP": "Object-Oriented Programming (OOP)",
  "Computer Organization and Architecture": "Computer Organization & Architecture",
  "Artificial Intelligence and Machine Learning": "Artificial Intelligence & ML",
  "Front End Engineering II": "Web Development",
  "Linux": "Linux & Shell Scripting",
  "Object Oriented Software Engineering": "Software Engineering",
  "Discrete Structures": "Discrete Mathematics",
};

// Snapshot fallback in case of external network downtime
const FALLBACK_LETSHELP_RESOURCES = [
  {
    title: "DSA Comprehensive Hand-written Notes",
    subject: "Data Structures & Algorithms",
    topic: "Arrays & Dynamic Programming",
    description: "Detailed handwritten notes covering fundamental arrays, recursion, and dynamic programming.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "notes",
    content: `# DSA Comprehensive Notes

### Topics Covered
- **Arrays & Pointers**: Memory layout, dynamic resizing, amortized time complexity.
- **Recursion & Backtracking**: Call stack analysis, base conditions, tree recursions.
- **Dynamic Programming**: Memoization vs Tabulation, optimal substructure, overlapping subproblems.

### Core Concepts
1. **Time Complexity Analysis**: Big-O, Big-Theta, Big-Omega notation guidelines.
2. **Standard Interview Patterns**: Two-pointer techniques, sliding window, prefix sums.

*Notes curated and maintained by Chitkara University student community on Let's Help Everyone.*`,
    tags: ["DSA", "Notes", "Arrays", "DP"],
  },
  {
    title: "DBMS Complete Lecture Notes",
    subject: "Database Management Systems (DBMS)",
    topic: "Normalization & SQL",
    description: "Lecture notes and SQL cheat sheets covering ER diagrams, Normal Forms (1NF to BCNF), and transactions.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "notes",
    content: `# DBMS Complete Lecture Notes

### Overview
Relational database management concepts, schema design principles, and transactional integrity.

### Key Sections:
1. **Relational Models & ER Diagrams**: Entities, attributes, primary & foreign keys, cardinality.
2. **Normalization**:
   - **1NF**: Eliminate repeating groups, atomic values.
   - **2NF**: Eliminate partial dependencies on composite primary keys.
   - **3NF**: Eliminate transitive functional dependencies ($X \\rightarrow Y$, $Y \\rightarrow Z$).
   - **BCNF**: For every functional dependency $X \\rightarrow Y$, $X$ must be a super key.
3. **Transactions & ACID Properties**: Atomicity, Consistency, Isolation, Durability.

*Curated by Let's Help Everyone Academic Network.*`,
    tags: ["DBMS", "SQL", "Normalization", "ACID"],
  },
  {
    title: "Computer Networks Exam Prep & Protocol Guide",
    subject: "Computer Networks",
    topic: "OSI & TCP/IP Model",
    description: "Structured notes on network models, routing algorithms, transport layer protocols, and subnetting.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "notes",
    content: `# Computer Networks Protocol Guide

### Layered Architecture
- **Application Layer**: HTTP, HTTPS, DNS, FTP, SMTP.
- **Transport Layer**: TCP (3-way handshake, congestion control) vs UDP (connectionless).
- **Network Layer**: IP addressing, CIDR subnetting, routing algorithms (OSPF, BGP, Distance Vector).
- **Data Link Layer**: Framing, error detection (CRC, parity), MAC addressing, CSMA/CD.

### Essential Formulas:
- Propagation Delay = Distance / Speed
- Transmission Delay = Packet Size / Bandwidth
- Throughput = Efficiency × Bandwidth`,
    tags: ["Networks", "Protocols", "TCP/IP", "Subnetting"],
  },
  {
    title: "Operating Systems Process & Memory Notes",
    subject: "Operating Systems",
    topic: "Processes & Scheduling",
    description: "Clear exam notes covering process states, CPU scheduling (FCFS, SJF, RR), deadlocks, and virtual memory.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "notes",
    content: `# Operating Systems Notes

### Key Units:
1. **Process Management**: Process Control Block (PCB), Context switching, Fork & Exec.
2. **CPU Scheduling**:
   - First Come First Served (FCFS)
   - Shortest Job First (SJF) & Preemptive SRTF
   - Round Robin (Time quantum selection)
3. **Deadlocks**:
   - Necessary conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.
   - Prevention & Banker's Algorithm for avoidance.
4. **Memory Management**: Paging, segmentation, TLB, Page replacement (FIFO, LRU, Optimal).`,
    tags: ["OS", "Processes", "Deadlocks", "Scheduling"],
  },
  {
    title: "OOP & C++ Design Principles",
    subject: "Object-Oriented Programming (OOP)",
    topic: "Inheritance & Polymorphism",
    description: "Guide to the 4 pillars of OOP, virtual functions, vtables, and standard design patterns.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "notes",
    content: `# Object-Oriented Programming Guide

### The Four Pillars:
1. **Encapsulation**: Bundling data with methods; data hiding using access specifiers.
2. **Abstraction**: Exposing only essential interface details while hiding internal complexity.
3. **Inheritance**: Code reusability via single, multiple, multilevel, and hierarchical inheritance.
4. **Polymorphism**: Compile-time (function overloading, operator overloading) and Run-time (virtual functions, dynamic dispatch).

### VTable & VPtr
How virtual methods are resolved at runtime via the virtual method table in C++ and Java.`,
    tags: ["OOP", "C++", "Polymorphism", "Design Patterns"],
  },
  {
    title: "Web Development & Frontend Engineering Roadmap",
    subject: "Web Development",
    topic: "Modern Frontend & React",
    description: "Practical roadmap and guide covering JavaScript, DOM, React Hooks, and state management.",
    source: "Let's Help Everyone",
    sourceUrl: "https://letshelp.vercel.app/year/CSE-2nd",
    contentType: "roadmap",
    content: `# Modern Web Development & React Guide

### Core Topics:
- **Modern JavaScript**: ES6+, Async/Await, Promises, Event Loop, Closures.
- **React Architecture**: Virtual DOM, Reconciliation, Component lifecycle.
- **Hooks Deep-Dive**: \`useState\`, \`useEffect\`, \`useMemo\`, \`useCallback\`, custom hooks.
- **State Management**: Context API, Zustand, Redux Toolkit patterns.
- **REST APIs & Fetching**: Error handling, caching strategies, and security (CORS, CSRF).`,
    tags: ["Web Dev", "React", "JavaScript", "Frontend"],
  },
];

class LetsHelpProvider {
  constructor() {
    this.name = "Let's Help Everyone";
  }

  async getResources() {
    try {
      const years = [1, 2, 3];
      const requests = years.map((year) =>
        axios
          .get(`${BASE_URL}/api/subjects`, {
            params: { year, branch: "CSE" },
            timeout: TIMEOUT_MS,
          })
          .then((res) => res.data?.subjects || [])
          .catch((err) => {
            console.warn(`[LetsHelpProvider] Year ${year} fetch warning:`, err.message);
            return [];
          })
      );

      const results = await Promise.all(requests);
      const rawSubjects = results.flat();

      if (!rawSubjects || rawSubjects.length === 0) {
        console.warn("[LetsHelpProvider] Live fetch returned 0 subjects; using snapshot fallback.");
        return FALLBACK_LETSHELP_RESOURCES.map(normalizeResource);
      }

      const extracted = [];

      for (const subj of rawSubjects) {
        const canonicalSubject = SUBJECT_NAME_MAP[subj.name] || subj.name;

        // Process notes
        if (Array.isArray(subj.notes)) {
          for (const item of subj.notes) {
            if (item.link && item.title) {
              extracted.push(
                normalizeResource({
                  title: `${subj.name}: ${item.title}`,
                  subject: canonicalSubject,
                  topic: "Class Notes & Study Material",
                  description: item.description || "Student-shared notes and reference material.",
                  source: this.name,
                  sourceUrl: item.link,
                  contentType: "notes",
                  content: `# ${item.title} (${canonicalSubject})\n\n**Description**: ${item.description || "Lecture notes and study material."}\n\n*Resource provided by Let's Help Everyone academic network.*`,
                  tags: [canonicalSubject, "Notes", "Student Resource"],
                })
              );
            }
          }
        }

        // Process exams / question banks
        if (Array.isArray(subj.exams)) {
          for (const item of subj.exams) {
            if (item.link && item.title) {
              extracted.push(
                normalizeResource({
                  title: `${subj.name}: ${item.title}`,
                  subject: canonicalSubject,
                  topic: "Exam Preparation & Questions",
                  description: item.description || "Previous year exam questions and practice dumps.",
                  source: this.name,
                  sourceUrl: item.link,
                  contentType: "exam",
                  content: `# ${item.title} - Exam Preparation\n\n**Subject**: ${canonicalSubject}\n**Details**: ${item.description || "Practice material and previous exams."}`,
                  tags: [canonicalSubject, "Exams", "Practice"],
                })
              );
            }
          }
        }

        // Process roadmaps
        if (Array.isArray(subj.roadmap)) {
          for (const item of subj.roadmap) {
            if (item.link && item.title) {
              extracted.push(
                normalizeResource({
                  title: `${subj.name}: ${item.title}`,
                  subject: canonicalSubject,
                  topic: "Course Roadmap",
                  description: item.description || "Official course roadmap and learning progression.",
                  source: this.name,
                  sourceUrl: item.link,
                  contentType: "roadmap",
                  content: `# ${subj.name} Course Roadmap\n\n**Milestone guide**: ${item.description || "Structured learning sequence."}`,
                  tags: [canonicalSubject, "Roadmap"],
                })
              );
            }
          }
        }
      }

      // Merge with curated detailed notes to ensure rich reading experience
      const mergedMap = new Map();
      for (const item of FALLBACK_LETSHELP_RESOURCES) {
        const norm = normalizeResource(item);
        mergedMap.set(norm.id, norm);
      }
      for (const item of extracted) {
        mergedMap.set(item.id, item);
      }

      return Array.from(mergedMap.values());
    } catch (error) {
      console.error("[LetsHelpProvider] Fatal error, falling back to snapshot:", error.message);
      return FALLBACK_LETSHELP_RESOURCES.map(normalizeResource);
    }
  }

  /**
   * Fetch all raw academic subjects from Let's Help Everyone grouped with real categories:
   * notes, books, youtube, website, exams, roadmap
   */
  async getAcademicSubjects() {
    try {
      const years = [1, 2, 3];
      const requests = years.map((year) =>
        axios
          .get(`${BASE_URL}/api/subjects`, {
            params: { year, branch: "CSE" },
            timeout: TIMEOUT_MS,
          })
          .then((res) => ({ year, subjects: res.data?.subjects || [] }))
          .catch((err) => {
            console.warn(`[LetsHelpProvider] Academic subjects fetch warning for year ${year}:`, err.message);
            return { year, subjects: [] };
          })
      );

      const yearResults = await Promise.all(requests);
      const allSubjects = [];

      for (const { year, subjects } of yearResults) {
        for (const subj of subjects) {
          const normalizeCategoryList = (list, categoryName) => {
            if (!Array.isArray(list)) return [];
            return list
              .filter((item) => item && (item.title || item.link))
              .map((item, idx) => {
                let link = (item.link || "").trim();
                if (link.startsWith("/")) {
                  link = `https://letshelp.vercel.app${link}`;
                }
                const title = (item.title || `${subj.name} Resource ${idx + 1}`).trim();
                return {
                  id: `lh-${categoryName}-${year}-${subj.id || subj.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${idx}`,
                  title,
                  link,
                  description: (item.description || "").trim(),
                  source: this.name,
                  category: categoryName,
                  subject: subj.name,
                  year: Number(subj.year || year),
                };
              });
          };

          const notes = normalizeCategoryList(subj.notes, "notes");
          const books = normalizeCategoryList(subj.books, "books");
          const youtube = normalizeCategoryList(subj.youtube, "youtube");
          const website = normalizeCategoryList(subj.website, "website");
          const exams = normalizeCategoryList(subj.exams, "exams");
          const roadmap = normalizeCategoryList(subj.roadmap, "roadmap");

          const totalCount = notes.length + books.length + youtube.length + website.length + exams.length + roadmap.length;

          allSubjects.push({
            id: subj.id || `subj-${year}-${subj.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            name: subj.name,
            year: Number(subj.year || year),
            branch: subj.branch || "CSE",
            description: `Academic study materials, notes, books, video lectures, and exams for ${subj.name}.`,
            notes,
            books,
            youtube,
            website,
            exams,
            roadmap,
            totalResources: totalCount,
          });
        }
      }

      return allSubjects;
    } catch (err) {
      console.error("[LetsHelpProvider] Failed to fetch academic subjects:", err.message);
      return [];
    }
  }
}

module.exports = new LetsHelpProvider();

