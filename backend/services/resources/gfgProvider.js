"use strict";

const { normalizeResource } = require("./resourceNormalizer");

const GFG_BASE = "https://www.geeksforgeeks.org";

const GFG_CURRICULUM = [
  // ── 1. Data Structures & Algorithms ─────────────────────────────────────────
  {
    title: "Array Data Structure & Common Operations",
    subject: "Data Structures & Algorithms",
    topic: "Arrays",
    description: "Introduction to arrays, contiguous memory allocation, insertion, deletion, and two-pointer algorithms.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/array-data-structure/`,
    contentType: "tutorial",
    content: `# Array Data Structure

An **Array** is a linear data structure that collects elements of the same data type stored at contiguous memory locations.

### Key Characteristics:
- **Index-based Access**: Elements are accessed in $O(1)$ constant time via an index: \`Address(A[i]) = BaseAddress + i × ElementSize\`.
- **Fixed Size**: In standard languages like C/C++, array capacity is fixed at allocation.
- **Cache Locality**: Contiguous storage provides superior CPU cache performance.

### Time Complexities:
| Operation | Time Complexity |
| :--- | :--- |
| Access | $O(1)$ |
| Search (Unsorted) | $O(n)$ |
| Search (Sorted / Binary Search) | $O(\\log n)$ |
| Insertion (At End) | $O(1)$ amortized |
| Insertion (Middle/Start) | $O(n)$ |
| Deletion | $O(n)$ |

### Popular Problem Patterns:
1. **Two Pointers**: Used in pair-sum problems, Dutch National Flag, container with most water.
2. **Sliding Window**: Maximum sum subarray of size $k$, longest substring without repeating characters.
3. **Prefix Sums**: Fast range sum queries in $O(1)$ after $O(n)$ precomputation.`,
    tags: ["DSA", "Arrays", "Time Complexity", "GFG"],
  },
  {
    title: "Binary Trees & Tree Traversals",
    subject: "Data Structures & Algorithms",
    topic: "Trees & Graphs",
    description: "Hierarchical data structures, binary trees, binary search trees (BST), and depth-first/breadth-first traversals.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/binary-tree-data-structure/`,
    contentType: "tutorial",
    content: `# Binary Tree & Tree Traversals

A **Binary Tree** is a non-linear hierarchical data structure in which each node has at most two children, referred to as the left child and right child.

### Standard Tree Traversals:
1. **In-Order Traversal (Left, Root, Right)**: Produces sorted order for Binary Search Trees (BST).
2. **Pre-Order Traversal (Root, Left, Right)**: Useful for copying or serializing trees.
3. **Post-Order Traversal (Left, Right, Root)**: Useful for bottom-up operations like tree deletion or calculating directory sizes.
4. **Level-Order Traversal (BFS)**: Uses a FIFO queue to visit nodes level-by-level.

### Properties of Binary Trees:
- Maximum number of nodes at level $l$: $2^l$ (where root is level 0).
- Maximum number of nodes in tree of height $h$: $2^{h+1} - 1$.
- In a non-empty binary tree with $N$ nodes and $E$ edges: $E = N - 1$.`,
    tags: ["DSA", "Trees", "BFS", "DFS", "GFG"],
  },
  {
    title: "Dynamic Programming Fundamentals",
    subject: "Data Structures & Algorithms",
    topic: "Dynamic Programming",
    description: "Solving complex problems by breaking them down into overlapping subproblems using memoization and tabulation.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/dynamic-programming/`,
    contentType: "guide",
    content: `# Dynamic Programming (DP)

**Dynamic Programming** is an algorithmic technique for solving optimization problems by breaking them into smaller subproblems, solving each subproblem just once, and storing their solutions.

### Two Necessary Properties:
1. **Optimal Substructure**: An optimal solution to the problem contains within it optimal solutions to subproblems.
2. **Overlapping Subproblems**: The recursive algorithm visits the same subproblems repeatedly rather than generating new subproblems.

### Approaches:
- **Top-Down (Memoization)**: Write recursive solution, cache subproblem results in a hash table or array.
- **Bottom-Up (Tabulation)**: Build solution iteratively starting from smallest base cases up to target.

### Classical DP Problems:
- 0/1 Knapsack Problem
- Longest Common Subsequence (LCS)
- Longest Increasing Subsequence (LIS)
- Matrix Chain Multiplication
- Coin Change & Edit Distance`,
    tags: ["DSA", "DP", "Algorithms", "Memoization", "GFG"],
  },

  // ── 2. Database Management Systems (DBMS) ───────────────────────────────────
  {
    title: "Database Normalization (1NF to BCNF)",
    subject: "Database Management Systems (DBMS)",
    topic: "Normalization",
    description: "Complete guide to database normalization, functional dependencies, eliminating redundancy, and normal forms.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/normalization-in-dbms/`,
    contentType: "tutorial",
    content: `# Database Normalization in DBMS

**Normalization** is the systematic approach of decomposing tables to eliminate data redundancy and undesirable anomalies (Insertion, Update, and Deletion Anomalies).

### Normal Forms Hierarchy:
\`Unnormalized Form (UNF) → 1NF → 2NF → 3NF → BCNF\`

#### 1. First Normal Form (1NF)
- Each column must contain atomic (indivisible) values.
- No repeating groups or arrays stored in a single field.

#### 2. Second Normal Form (2NF)
- Table must be in **1NF**.
- No **partial dependency**: No non-prime attribute should depend on a proper subset of any candidate key.

#### 3. Third Normal Form (3NF)
- Table must be in **2NF**.
- No **transitive dependency**: For every functional dependency $X \\rightarrow Y$, either:
  - $X$ is a super key, OR
  - $Y$ is a prime attribute (part of a candidate key).

#### 4. Boyce-Codd Normal Form (BCNF)
- Stricter version of 3NF.
- For every non-trivial functional dependency $X \\rightarrow Y$, **$X$ MUST be a super key**.`,
    tags: ["DBMS", "Normalization", "SQL", "BCNF", "GFG"],
  },
  {
    title: "SQL Queries, Joins, and Indexing",
    subject: "Database Management Systems (DBMS)",
    topic: "SQL & Query Optimization",
    description: "Structured Query Language guide covering INNER/OUTER JOINs, GROUP BY, subqueries, and B-Tree indexing.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/sql-tutorial/`,
    contentType: "tutorial",
    content: `# SQL Queries & Indexing

**SQL** (Structured Query Language) is the standard language for relational database interaction.

### SQL Join Types:
- **INNER JOIN**: Returns records that have matching values in both tables.
- **LEFT (OUTER) JOIN**: Returns all records from left table, and matched records from right table.
- **RIGHT (OUTER) JOIN**: Returns all records from right table, and matched records from left table.
- **FULL (OUTER) JOIN**: Returns all records when there is a match in either table.

### B-Tree Indexing:
- Indexes create an auxiliary balanced search tree pointing to disk blocks.
- Drastically reduces search time from $O(N)$ full table scans to $O(\\log N)$.
- Indexes speed up reads (\`SELECT\`) but add overhead to writes (\`INSERT\`, \`UPDATE\`, \`DELETE\`).`,
    tags: ["DBMS", "SQL", "Joins", "Indexing", "GFG"],
  },
  {
    title: "Transactions and ACID Properties",
    subject: "Database Management Systems (DBMS)",
    topic: "Transactions & Concurrency",
    description: "Understanding transaction states, ACID guarantees, serializability, and two-phase locking (2PL).",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/acid-properties-in-dbms/`,
    contentType: "guide",
    content: `# ACID Properties & Transactions

A **Transaction** is a logical unit of database operations that must be executed either completely or not at all.

### The ACID Guarantee:
1. **Atomicity**: "All or Nothing". Handled by the database recovery manager (WAL / Write-Ahead Logging).
2. **Consistency**: The database must remain in a valid state satisfying all integrity constraints before and after execution.
3. **Isolation**: Concurrent transactions must execute without interfering with one another. (Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable).
4. **Durability**: Once committed, changes are permanent even across power failures or system crashes.`,
    tags: ["DBMS", "ACID", "Transactions", "Concurrency", "GFG"],
  },

  // ── 3. Operating Systems ───────────────────────────────────────────────────
  {
    title: "Processes, Threads, and CPU Scheduling",
    subject: "Operating Systems",
    topic: "Processes & Scheduling",
    description: "Process lifecycle, Process Control Block (PCB), user vs kernel threads, context switching, and scheduling algorithms.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/operating-systems/`,
    contentType: "tutorial",
    content: `# Operating Systems: Processes & Scheduling

A **Process** is an active instance of a computer program in execution, containing program counter, stack, registers, and data section.

### Process States:
\`New → Ready ⇄ Running → Terminated\`
*(with Waiting / Blocked for I/O operations)*

### CPU Scheduling Algorithms:
- **First Come First Served (FCFS)**: Non-preemptive, prone to convoy effect.
- **Shortest Job First (SJF)**: Optimal average waiting time; requires knowing burst time in advance.
- **Round Robin (RR)**: Preemptive scheduling with a fixed time quantum ($q$); ideal for time-sharing systems.
- **Priority Scheduling**: Can suffer from starvation (solved via aging).`,
    tags: ["OS", "Processes", "Threads", "CPU Scheduling", "GFG"],
  },
  {
    title: "Deadlocks & The Banker's Algorithm",
    subject: "Operating Systems",
    topic: "Deadlocks & Synchronization",
    description: "Conditions for deadlock, prevention strategies, detection, and avoidance using Dijkstra's Banker's Algorithm.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/deadlock-in-operating-system/`,
    contentType: "guide",
    content: `# Deadlocks & Synchronization

A **Deadlock** is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process.

### The 4 Coffman Conditions (Must all hold simultaneously):
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process holds at least one resource and is waiting to acquire additional resources.
3. **No Preemption**: Resources cannot be forcibly preempted; only released voluntarily.
4. **Circular Wait**: A closed loop of processes where each waits for a resource held by the next.

### Deadlock Handling:
- **Deadlock Prevention**: Invalidate at least one of the 4 conditions.
- **Deadlock Avoidance**: Banker's Algorithm ensures the system never enters an unsafe state.
- **Deadlock Detection & Recovery**: Allow deadlock to occur, detect via wait-for graph, and preempt/kill processes.`,
    tags: ["OS", "Deadlocks", "Bankers Algorithm", "Synchronization", "GFG"],
  },
  {
    title: "Virtual Memory, Paging, and Page Replacement",
    subject: "Operating Systems",
    topic: "Memory Management",
    description: "Paging, segmentation, Translation Lookaside Buffers (TLB), thrashing, and page replacement (LRU, FIFO, Optimal).",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/virtual-memory-in-operating-system/`,
    contentType: "tutorial",
    content: `# Virtual Memory & Page Replacement

**Virtual Memory** is a memory management capability of an OS that creates the illusion to users of a very large (main) memory.

### Paging Mechanism:
- Logical memory is divided into fixed-size blocks called **Pages**.
- Physical memory is divided into blocks of the same size called **Frames**.
- **Page Table**: Translates logical addresses (Page Number $p$, Offset $d$) to physical frame addresses.
- **TLB (Translation Lookaside Buffer)**: High-speed hardware cache for page table lookups.

### Page Replacement Algorithms:
1. **FIFO (First-In-First-Out)**: Replaces the oldest page; can suffer from *Belady's Anomaly*.
2. **Optimal Page Replacement (OPT)**: Replaces the page that will not be used for the longest future period; theoretical benchmark.
3. **Least Recently Used (LRU)**: Replaces the page that has not been used for the longest time period in the past.`,
    tags: ["OS", "Memory Management", "Paging", "Virtual Memory", "GFG"],
  },

  // ── 4. Computer Networks ────────────────────────────────────────────────────
  {
    title: "OSI Reference Model vs TCP/IP Protocol Suite",
    subject: "Computer Networks",
    topic: "Network Models & Architecture",
    description: "Layer-by-layer architectural comparison, protocol encapsulation, and packet transmission through the stack.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/layers-of-osi-model/`,
    contentType: "tutorial",
    content: `# OSI Model vs TCP/IP Suite

The **OSI (Open Systems Interconnection)** model defines a conceptual framework of 7 functional layers for network communication.

### 7 Layers of OSI:
1. **Application (Layer 7)**: Network processes to applications (HTTP, DNS, SSH, FTP).
2. **Presentation (Layer 6)**: Data representation, encryption, SSL/TLS, compression.
3. **Session (Layer 5)**: Interhost communication, session establishment/termination.
4. **Transport (Layer 4)**: End-to-end connections, reliability, flow control (TCP, UDP).
5. **Network (Layer 3)**: Path determination and IP addressing (IPv4, IPv6, ICMP).
6. **Data Link (Layer 2)**: Physical addressing, MAC, framing, error detection (Ethernet, Wi-Fi).
7. **Physical (Layer 1)**: Binary transmission, physical cables, radio frequencies.

### TCP vs UDP Comparison:
| Feature | TCP | UDP |
| :--- | :--- | :--- |
| Connection | Connection-oriented (3-way handshake) | Connectionless |
| Reliability | Guaranteed delivery with ACK & retransmissions | Best-effort, no guarantees |
| Speed | Slower due to overhead | Faster, minimal overhead |
| Use cases | Web (HTTP), email, file transfer | Video streaming, VoIP, DNS, gaming |`,
    tags: ["Networks", "OSI Model", "TCP/IP", "Protocols", "GFG"],
  },
  {
    title: "IP Addressing, CIDR, and Subnetting",
    subject: "Computer Networks",
    topic: "IP Addressing & Routing",
    description: "IPv4 structure, Classless Inter-Domain Routing (CIDR), calculating network addresses, broadcast addresses, and subnet masks.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/ip-addressing/`,
    contentType: "guide",
    content: `# IP Addressing & CIDR Subnetting

An **IPv4 address** is a 32-bit numeric address written as four 8-bit octets separated by dots (e.g. \`192.168.1.1\`).

### CIDR Notation:
- Written as \`IP/Prefix\`, e.g. \`192.168.1.0/24\`.
- The prefix length (/24) indicates that the first 24 bits are the **Network ID**, and the remaining 8 bits are for **Host IDs**.
- Available host addresses in a subnet: $2^{(32 - \\text{prefix})} - 2$ (subtracting network and broadcast addresses).

### Routing Protocols:
- **Intra-Domain**: RIP (Distance Vector), OSPF (Link State, Dijkstra-based).
- **Inter-Domain**: BGP (Border Gateway Protocol, Path Vector).`,
    tags: ["Networks", "Subnetting", "CIDR", "Routing", "GFG"],
  },

  // ── 5. Object-Oriented Programming (OOP) ────────────────────────────────────
  {
    title: "OOP Concepts: Encapsulation, Abstraction, Inheritance, Polymorphism",
    subject: "Object-Oriented Programming (OOP)",
    topic: "Core OOP Principles",
    description: "Complete overview of the 4 fundamental pillars of object-oriented design with code examples and best practices.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/object-oriented-programming-in-cpp/`,
    contentType: "tutorial",
    content: `# Core Object-Oriented Programming Principles

Object-Oriented Programming (OOP) organizes software design around data, or **objects**, rather than functions and logic.

### 1. Encapsulation
Bundling data attributes and methods that manipulate that data into a single unit (class), while restricting direct access to internal components using access specifiers (\`private\`, \`protected\`, \`public\`).

### 2. Abstraction
Hiding internal implementation details and exposing only essential interface operations to the caller (via abstract classes and interfaces).

### 3. Inheritance
The mechanism of deriving a new class from an existing class to promote code reuse and hierarchical classification.

### 4. Polymorphism
The ability of different objects to respond to the same message in different ways:
- **Static / Compile-Time**: Method overloading and operator overloading.
- **Dynamic / Run-Time**: Method overriding via virtual functions and vtables.`,
    tags: ["OOP", "Design Patterns", "Polymorphism", "Encapsulation", "GFG"],
  },

  // ── 6. System Design ────────────────────────────────────────────────────────
  {
    title: "System Design: Scalability, Caching, and Load Balancing",
    subject: "System Design",
    topic: "High-Level Architecture",
    description: "Architecting large-scale systems, vertical vs horizontal scaling, reverse proxies, distributed caching, and CAP theorem.",
    source: "GeeksforGeeks",
    sourceUrl: `${GFG_BASE}/system-design-tutorial/`,
    contentType: "guide",
    content: `# System Design Fundamentals

Designing reliable, scalable, and maintainable systems for millions of concurrent users.

### 1. Scalability:
- **Vertical Scaling (Scale Up)**: Adding more CPU/RAM to a single server. Limited by hardware caps and single point of failure.
- **Horizontal Scaling (Scale Out)**: Adding more server nodes. Requires load balancing and stateless application tiers.

### 2. Load Balancing:
Distributes incoming client requests across multiple backend instances.
- **Algorithms**: Round Robin, Weighted Round Robin, Least Connections, IP Hash.
- **Technologies**: Nginx, HAProxy, AWS ALB.

### 3. Distributed Caching:
Placing frequently accessed data in memory (Redis, Memcached) to reduce database read load by orders of magnitude.
- Cache Invalidation Strategies: Write-Through, Write-Back, Cache-Aside.

### 4. CAP Theorem:
In any distributed data store, you can guarantee at most **two** of the following three:
- **Consistency**: Every read receives the most recent write.
- **Availability**: Every request receives a non-error response.
- **Partition Tolerance**: The system continues to operate despite arbitrary network dropouts.`,
    tags: ["System Design", "Scalability", "Caching", "Load Balancing", "GFG"],
  },
];

class GFGProvider {
  constructor() {
    this.name = "GeeksforGeeks";
  }

  async getResources() {
    return GFG_CURRICULUM.map(normalizeResource);
  }

  getAllTutorials() {
    return GFG_CURRICULUM;
  }

  getTutorialsForSubject(subjectName) {
    if (!subjectName) return [];
    const lower = subjectName.toLowerCase();
    return GFG_CURRICULUM.filter((item) => {
      const itemSubj = (item.subject || "").toLowerCase();
      if (lower.includes("data structure") || lower.includes("dsa") || lower.includes("algorithm")) {
        return itemSubj.includes("data structure");
      }
      if (lower.includes("database") || lower.includes("dbms")) {
        return itemSubj.includes("database") || itemSubj.includes("dbms");
      }
      if (lower.includes("operating system") || lower === "os") {
        return itemSubj.includes("operating system");
      }
      if (lower.includes("network")) {
        return itemSubj.includes("network");
      }
      if (lower.includes("cpp") || lower.includes("c++") || lower.includes("object oriented") || lower.includes("oop")) {
        return itemSubj.includes("object-oriented") || itemSubj.includes("oop");
      }
      if (lower.includes("system design")) {
        return itemSubj.includes("system design");
      }
      return itemSubj === lower;
    });
  }
}

module.exports = new GFGProvider();

