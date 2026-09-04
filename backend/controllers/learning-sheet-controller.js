"use strict";
const LearningSheet = require("../models/learning-sheet-model");
const LearningSheetProgress = require("../models/learning-sheet-progress-model");

const CACHE_MS = 10 * 60 * 1000;
let providerCache = { value: null, expires: 0 };

function safeUrl(value) {
  const u = new URL(String(value || ""));
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Sheet URL must use HTTP or HTTPS");
  }
  return u.toString();
}

function cleanItem(item, index) {
  if (!item || typeof item !== "object") return null;
  const title = String(item.title || item.name || item.problemName || "Question " + (index + 1)).trim();
  const url = item.url || item.link || item.problemUrl || "";
  if (!url) return null;
  let safe;
  try {
    safe = safeUrl(url);
  } catch {
    return null;
  }
  return {
    id: String(item.id || item.slug || safe),
    title,
    url: safe,
    platform: String(item.platform || item.source || "External"),
    difficulty: String(item.difficulty || item.rating || ""),
    topic: String(item.topic || item.category || ""),
    description: String(item.description || "").trim(),
  };
}

function cleanCollection(raw, provider, index) {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title || raw.name || raw.sheetName || "Untitled sheet").trim();
  const sourceUrl = raw.sourceUrl || raw.url || raw.link || "";
  let safe = "";
  try {
    if (sourceUrl) safe = safeUrl(sourceUrl);
  } catch {}
  const items = (raw.items || raw.questions || raw.problems || []).map(cleanItem).filter(Boolean);
  if (items.length === 0) return null;
  return {
    id: String(raw.id || raw.slug || `${provider}-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
    provider,
    title,
    category: String(raw.category || raw.type || "General"),
    description: String(raw.description || "").trim(),
    sourceUrl: safe,
    items,
  };
}

const BASE_COLLECTIONS = [
  // ─── TLE ELIMINATORS CP-31 SHEETS ──────────────────────────────────────────
  {
    id: "tle-cp31-800",
    provider: "tle",
    title: "TLE CP-31 Sheet (800 Rating)",
    category: "Competitive Programming",
    description: "31 foundational Codeforces problems (Rating 800) hand-picked by TLE Eliminators for mastering beginner CP fundamentals.",
    sourceUrl: "https://www.tle-eliminators.com/cp-sheet",
    items: [
      { id: "cf-1903A", title: "Halloumi Boxes", url: "https://codeforces.com/problemset/problem/1903/A", platform: "Codeforces", difficulty: "800", topic: "Arrays & Sorting" },
      { id: "cf-1901A", title: "Line Trip", url: "https://codeforces.com/problemset/problem/1901/A", platform: "Codeforces", difficulty: "800", topic: "Greedy & Math" },
      { id: "cf-1900A", title: "Cover in Water", url: "https://codeforces.com/problemset/problem/1900/A", platform: "Codeforces", difficulty: "800", topic: "Constructive & Strings" },
      { id: "cf-1899A", title: "Game with Integers", url: "https://codeforces.com/problemset/problem/1899/A", platform: "Codeforces", difficulty: "800", topic: "Math & Games" },
      { id: "cf-1896A", title: "Jagged Swaps", url: "https://codeforces.com/problemset/problem/1896/A", platform: "Codeforces", difficulty: "800", topic: "Sorting & Arrays" },
      { id: "cf-1890A", title: "Doremy's Paint 3", url: "https://codeforces.com/problemset/problem/1890/A", platform: "Codeforces", difficulty: "800", topic: "Constructive Algorithms" },
      { id: "cf-1881A", title: "Don't Try to Count", url: "https://codeforces.com/problemset/problem/1881/A", platform: "Codeforces", difficulty: "800", topic: "Strings & Brute Force" },
      { id: "cf-1878A", title: "How Much Does Daytona Cost?", url: "https://codeforces.com/problemset/problem/1878/A", platform: "Codeforces", difficulty: "800", topic: "Greedy & Arrays" },
      { id: "cf-1877A", title: "Goals of Victory", url: "https://codeforces.com/problemset/problem/1877/A", platform: "Codeforces", difficulty: "800", topic: "Math" },
      { id: "cf-1873C", title: "Target Practice", url: "https://codeforces.com/problemset/problem/1873/C", platform: "Codeforces", difficulty: "800", topic: "Implementation" },
      { id: "cf-1866A", title: "Ambitious Kid", url: "https://codeforces.com/problemset/problem/1866/A", platform: "Codeforces", difficulty: "800", topic: "Math & Greedy" },
      { id: "cf-1862B", title: "Sequence Game", url: "https://codeforces.com/problemset/problem/1862/B", platform: "Codeforces", difficulty: "800", topic: "Constructive & Arrays" },
      { id: "cf-1859A", title: "United We Stand", url: "https://codeforces.com/problemset/problem/1859/A", platform: "Codeforces", difficulty: "800", topic: "Number Theory & Arrays" },
      { id: "cf-1858A", title: "Buttons", url: "https://codeforces.com/problemset/problem/1858/A", platform: "Codeforces", difficulty: "800", topic: "Games & Greedy" },
      { id: "cf-1857A", title: "Array Coloring", url: "https://codeforces.com/problemset/problem/1857/A", platform: "Codeforces", difficulty: "800", topic: "Math & Parity" },
      { id: "cf-1853A", title: "Desorting", url: "https://codeforces.com/problemset/problem/1853/A", platform: "Codeforces", difficulty: "800", topic: "Arrays & Math" },
      { id: "cf-1845A", title: "Forbidden Integer", url: "https://codeforces.com/problemset/problem/1845/A", platform: "Codeforces", difficulty: "800", topic: "Constructive & Math" },
      { id: "cf-1837A", title: "Grasshopper on a Line", url: "https://codeforces.com/problemset/problem/1837/A", platform: "Codeforces", difficulty: "800", topic: "Constructive & Math" },
      { id: "cf-1834A", title: "Unit Array", url: "https://codeforces.com/problemset/problem/1834/A", platform: "Codeforces", difficulty: "800", topic: "Greedy & Math" },
      { id: "cf-1831A", title: "Twin Permutations", url: "https://codeforces.com/problemset/problem/1831/A", platform: "Codeforces", difficulty: "800", topic: "Constructive" },
      { id: "cf-1829B", title: "Blank Space", url: "https://codeforces.com/problemset/problem/1829/B", platform: "Codeforces", difficulty: "800", topic: "Implementation" },
      { id: "cf-1814A", title: "Coins", url: "https://codeforces.com/problemset/problem/1814/A", platform: "Codeforces", difficulty: "800", topic: "Math & Parity" },
      { id: "cf-1806A", title: "Walking Master", url: "https://codeforces.com/problemset/problem/1806/A", platform: "Codeforces", difficulty: "800", topic: "Math & Geometry" },
      { id: "cf-1805A", title: "We Need the Zero", url: "https://codeforces.com/problemset/problem/1805/A", platform: "Codeforces", difficulty: "800", topic: "Bitwise Operations" },
      { id: "cf-1791C", title: "Prepend and Append", url: "https://codeforces.com/problemset/problem/1791/C", platform: "Codeforces", difficulty: "800", topic: "Two Pointers & Strings" },
      { id: "cf-1788A", title: "One and Two", url: "https://codeforces.com/problemset/problem/1788/A", platform: "Codeforces", difficulty: "800", topic: "Math & Arrays" },
      { id: "cf-1783A", title: "Make it Beautiful", url: "https://codeforces.com/problemset/problem/1783/A", platform: "Codeforces", difficulty: "800", topic: "Constructive & Sorting" },
      { id: "cf-1777A", title: "Everybody Likes Good Arrays!", url: "https://codeforces.com/problemset/problem/1777/A", platform: "Codeforces", difficulty: "800", topic: "Parity & Greedy" },
      { id: "cf-1766A", title: "Extremely Round", url: "https://codeforces.com/problemset/problem/1766/A", platform: "Codeforces", difficulty: "800", topic: "Math & Brute Force" },
      { id: "cf-1761A", title: "Two Permutations", url: "https://codeforces.com/problemset/problem/1761/A", platform: "Codeforces", difficulty: "800", topic: "Constructive & Permutations" },
      { id: "cf-1789A", title: "Serval and Mocha's Array", url: "https://codeforces.com/problemset/problem/1789/A", platform: "Codeforces", difficulty: "800", topic: "GCD & Math" },
    ],
  },
  {
    id: "tle-cp31-900",
    provider: "tle",
    title: "TLE CP-31 Sheet (900 Rating)",
    category: "Competitive Programming",
    description: "31 Codeforces rating 900 problems from TLE Eliminators focusing on greedy heuristics, math tricks, and two pointers.",
    sourceUrl: "https://www.tle-eliminators.com/cp-sheet",
    items: [
      { id: "cf-1904A", title: "Forked!", url: "https://codeforces.com/problemset/problem/1904/A", platform: "Codeforces", difficulty: "900", topic: "Geometry & Chess" },
      { id: "cf-1883B", title: "Chemistry", url: "https://codeforces.com/problemset/problem/1883/B", platform: "Codeforces", difficulty: "900", topic: "Strings & Palindromes" },
      { id: "cf-1878C", title: "Vasilije in Cacak", url: "https://codeforces.com/problemset/problem/1878/C", platform: "Codeforces", difficulty: "900", topic: "Math & Bounds" },
      { id: "cf-1875A", title: "Jellyfish and Undertale", url: "https://codeforces.com/problemset/problem/1875/A", platform: "Codeforces", difficulty: "900", topic: "Greedy" },
      { id: "cf-1869A", title: "Make It Zero", url: "https://codeforces.com/problemset/problem/1869/A", platform: "Codeforces", difficulty: "900", topic: "Bitwise XOR & Constructive" },
      { id: "cf-1855B", title: "Longest Divisors Interval", url: "https://codeforces.com/problemset/problem/1855/B", platform: "Codeforces", difficulty: "900", topic: "Math & Number Theory" },
      { id: "cf-1850D", title: "Balanced Round", url: "https://codeforces.com/problemset/problem/1850/D", platform: "Codeforces", difficulty: "900", topic: "Sorting & Greedy" },
      { id: "cf-1837B", title: "Comparison String", url: "https://codeforces.com/problemset/problem/1837/B", platform: "Codeforces", difficulty: "900", topic: "Strings & Greedy" },
      { id: "cf-1828B", title: "Permutation Swap", url: "https://codeforces.com/problemset/problem/1828/B", platform: "Codeforces", difficulty: "900", topic: "Math & GCD" },
      { id: "cf-1807D", title: "Odd Queries", url: "https://codeforces.com/problemset/problem/1807/D", platform: "Codeforces", difficulty: "900", topic: "Prefix Sums & Parity" },
      { id: "cf-1794B", title: "Not Dividing", url: "https://codeforces.com/problemset/problem/1794/B", platform: "Codeforces", difficulty: "900", topic: "Constructive & Divisibility" },
      { id: "cf-1696B", title: "NIT Destroys the Universe", url: "https://codeforces.com/problemset/problem/1696/B", platform: "Codeforces", difficulty: "900", topic: "Greedy & Arrays" },
      { id: "cf-1679A", title: "AvtoBus", url: "https://codeforces.com/problemset/problem/1679/A", platform: "Codeforces", difficulty: "900", topic: "Math & Number Theory" },
      { id: "cf-1675B", title: "Make It Increasing", url: "https://codeforces.com/problemset/problem/1675/B", platform: "Codeforces", difficulty: "900", topic: "Greedy & Implementation" },
      { id: "cf-1666D", title: "Deletive Editing", url: "https://codeforces.com/problemset/problem/1666/D", platform: "Codeforces", difficulty: "900", topic: "Strings & Two Pointers" },
      { id: "cf-1665B", title: "Array Cloning Technique", url: "https://codeforces.com/problemset/problem/1665/B", platform: "Codeforces", difficulty: "900", topic: "Greedy & Hash Maps" },
      { id: "cf-1624B", title: "Make AP", url: "https://codeforces.com/problemset/problem/1624/B", platform: "Codeforces", difficulty: "900", topic: "Math & Sequences" },
      { id: "cf-1607B", title: "Odd Grasshopper", url: "https://codeforces.com/problemset/problem/1607/B", platform: "Codeforces", difficulty: "900", topic: "Math & Modulo" },
      { id: "cf-1606A", title: "AB Balance", url: "https://codeforces.com/problemset/problem/1606/A", platform: "Codeforces", difficulty: "900", topic: "Strings & Constructive" },
      { id: "cf-1593B", title: "Make it Divisible by 25", url: "https://codeforces.com/problemset/problem/1593/B", platform: "Codeforces", difficulty: "900", topic: "Greedy & Math" },
      { id: "cf-1559A", title: "Mocha and Math", url: "https://codeforces.com/problemset/problem/1559/A", platform: "Codeforces", difficulty: "900", topic: "Bitwise AND" },
      { id: "cf-1543A", title: "Exciting Bets", url: "https://codeforces.com/problemset/problem/1543/A", platform: "Codeforces", difficulty: "900", topic: "Math & GCD" },
      { id: "cf-1537B", title: "Bad Boy", url: "https://codeforces.com/problemset/problem/1537/B", platform: "Codeforces", difficulty: "900", topic: "Geometry & Greedy" },
      { id: "cf-1475A", title: "Odd Divisor", url: "https://codeforces.com/problemset/problem/1475/A", platform: "Codeforces", difficulty: "900", topic: "Bitwise & Math" },
      { id: "cf-1471A", title: "Strange Partition", url: "https://codeforces.com/problemset/problem/1471/A", platform: "Codeforces", difficulty: "900", topic: "Math & Greedy" },
      { id: "cf-1440B", title: "Sum of Medians", url: "https://codeforces.com/problemset/problem/1440/B", platform: "Codeforces", difficulty: "900", topic: "Greedy & Math" },
      { id: "cf-1374B", title: "Multiply by 2, divide by 6", url: "https://codeforces.com/problemset/problem/1374/B", platform: "Codeforces", difficulty: "900", topic: "Math & Prime Factorization" },
      { id: "cf-1373B", title: "01 Game", url: "https://codeforces.com/problemset/problem/1373/B", platform: "Codeforces", difficulty: "900", topic: "Games & Strings" },
      { id: "cf-1351B", title: "Square?", url: "https://codeforces.com/problemset/problem/1351/B", platform: "Codeforces", difficulty: "900", topic: "Geometry & Math" },
      { id: "cf-1343A", title: "Candies", url: "https://codeforces.com/problemset/problem/1343/A", platform: "Codeforces", difficulty: "900", topic: "Math & Bit Manipulation" },
      { id: "cf-1335B", title: "Construct the String", url: "https://codeforces.com/problemset/problem/1335/B", platform: "Codeforces", difficulty: "900", topic: "Constructive & Strings" },
    ],
  },
  {
    id: "tle-cp31-1000",
    provider: "tle",
    title: "TLE CP-31 Sheet (1000 Rating)",
    category: "Competitive Programming",
    description: "31 Codeforces rating 1000 problems from TLE Eliminators covering binary search, sorting paradigms, and advanced constructive math.",
    sourceUrl: "https://www.tle-eliminators.com/cp-sheet",
    items: [
      { id: "cf-1913B", title: "Swap and Delete", url: "https://codeforces.com/problemset/problem/1913/B", platform: "Codeforces", difficulty: "1000", topic: "Strings & Greedy" },
      { id: "cf-1883C", title: "Raspberries", url: "https://codeforces.com/problemset/problem/1883/C", platform: "Codeforces", difficulty: "1000", topic: "Math & Divisibility" },
      { id: "cf-1876A", title: "Helmets in Night Light", url: "https://codeforces.com/problemset/problem/1876/A", platform: "Codeforces", difficulty: "1000", topic: "Greedy & Sorting" },
      { id: "cf-1869B", title: "2D Traveling", url: "https://codeforces.com/problemset/problem/1869/B", platform: "Codeforces", difficulty: "1000", topic: "Geometry & Shortest Path" },
      { id: "cf-1859B", title: "Olya and Game with Arrays", url: "https://codeforces.com/problemset/problem/1859/B", platform: "Codeforces", difficulty: "1000", topic: "Greedy & Sorting" },
      { id: "cf-1849B", title: "Monsters", url: "https://codeforces.com/problemset/problem/1849/B", platform: "Codeforces", difficulty: "1000", topic: "Sorting & Modulo" },
      { id: "cf-1840C", title: "Ski Resort", url: "https://codeforces.com/problemset/problem/1840/C", platform: "Codeforces", difficulty: "1000", topic: "Combinatorics & Two Pointers" },
      { id: "cf-1837C", title: "Best Binary String", url: "https://codeforces.com/problemset/problem/1837/C", platform: "Codeforces", difficulty: "1000", topic: "Greedy & Strings" },
      { id: "cf-1798B", title: "Three Sevens", url: "https://codeforces.com/problemset/problem/1798/B", platform: "Codeforces", difficulty: "1000", topic: "Hash Maps & Greedy" },
      { id: "cf-1791D", title: "Distinct Split", url: "https://codeforces.com/problemset/problem/1791/D", platform: "Codeforces", difficulty: "1000", topic: "Prefix Sums & Strings" },
      { id: "cf-1765M", title: "Minimum LCM", url: "https://codeforces.com/problemset/problem/1765/M", platform: "Codeforces", difficulty: "1000", topic: "Number Theory & LCM" },
      { id: "cf-1744C", title: "Traffic Light", url: "https://codeforces.com/problemset/problem/1744/C", platform: "Codeforces", difficulty: "1000", topic: "Two Pointers & Strings" },
      { id: "cf-1715B", title: "Beautiful Array", url: "https://codeforces.com/problemset/problem/1715/B", platform: "Codeforces", difficulty: "1000", topic: "Constructive & Math" },
      { id: "cf-1704B", title: "Luke is a foodie", url: "https://codeforces.com/problemset/problem/1704/B", platform: "Codeforces", difficulty: "1000", topic: "Intervals & Greedy" },
      { id: "cf-1691B", title: "Shoe Shuffling", url: "https://codeforces.com/problemset/problem/1691/B", platform: "Codeforces", difficulty: "1000", topic: "Constructive & Two Pointers" },
      { id: "cf-1690D", title: "Black and White Stripe", url: "https://codeforces.com/problemset/problem/1690/D", platform: "Codeforces", difficulty: "1000", topic: "Sliding Window" },
      { id: "cf-1676E", title: "Eating Queries", url: "https://codeforces.com/problemset/problem/1676/E", platform: "Codeforces", difficulty: "1000", topic: "Binary Search & Prefix Sums" },
      { id: "cf-1659A", title: "Red Versus Blue", url: "https://codeforces.com/problemset/problem/1659/A", platform: "Codeforces", difficulty: "1000", topic: "Constructive & Math" },
      { id: "cf-1632B", title: "Roof Construction", url: "https://codeforces.com/problemset/problem/1632/B", platform: "Codeforces", difficulty: "1000", topic: "Bitwise Operations" },
      { id: "cf-1620B", title: "Triangles on a Rectangle", url: "https://codeforces.com/problemset/problem/1620/B", platform: "Codeforces", difficulty: "1000", topic: "Geometry & Math" },
      { id: "cf-1614B", title: "Divan and a New Project", url: "https://codeforces.com/problemset/problem/1614/B", platform: "Codeforces", difficulty: "1000", topic: "Sorting & Greedy" },
      { id: "cf-1506C", title: "Double-ended Strings", url: "https://codeforces.com/problemset/problem/1506/C", platform: "Codeforces", difficulty: "1000", topic: "Strings & Substrings" },
      { id: "cf-1485A", title: "Add and Divide", url: "https://codeforces.com/problemset/problem/1485/A", platform: "Codeforces", difficulty: "1000", topic: "Math & Brute Force" },
      { id: "cf-1476A", title: "K-divisible Sum", url: "https://codeforces.com/problemset/problem/1476/A", platform: "Codeforces", difficulty: "1000", topic: "Math & Greedy" },
      { id: "cf-1438B", title: "Valerii Against Everyone", url: "https://codeforces.com/problemset/problem/1438/B", platform: "Codeforces", difficulty: "1000", topic: "Bitwise Powers & Sets" },
      { id: "cf-1411B", title: "Fair Numbers", url: "https://codeforces.com/problemset/problem/1411/B", platform: "Codeforces", difficulty: "1000", topic: "Number Theory & LCM" },
      { id: "cf-1374C", title: "Move Brackets", url: "https://codeforces.com/problemset/problem/1374/C", platform: "Codeforces", difficulty: "1000", topic: "Stack & Greedy" },
      { id: "cf-1362A", title: "Johnny and Ancient Computer", url: "https://codeforces.com/problemset/problem/1362/A", platform: "Codeforces", difficulty: "1000", topic: "Bitwise & Math" },
      { id: "cf-1312B", title: "Bogosort", url: "https://codeforces.com/problemset/problem/1312/B", platform: "Codeforces", difficulty: "1000", topic: "Constructive & Sorting" },
      { id: "cf-1182A", title: "Filling Shapes", url: "https://codeforces.com/problemset/problem/1182/A", platform: "Codeforces", difficulty: "1000", topic: "Combinatorics & DP" },
      { id: "cf-115A", title: "Party", url: "https://codeforces.com/problemset/problem/115/A", platform: "Codeforces", difficulty: "1000", topic: "Trees & DFS" },
    ],
  },

  // ─── CODOLIO SHEETS ────────────────────────────────────────────────────────
  {
    id: "codolio-blind-75",
    provider: "codolio",
    title: "Codolio Blind 75 DSA Sheet",
    category: "Coding Interviews",
    description: "The gold-standard curated list of 75 essential LeetCode algorithmic questions organized by pattern and data structure.",
    sourceUrl: "https://codolio.com",
    items: [
      { id: "lc-1", title: "Two Sum", url: "https://leetcode.com/problems/two-sum/", platform: "LeetCode", difficulty: "Easy", topic: "Arrays & Hash Table" },
      { id: "lc-121", title: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", platform: "LeetCode", difficulty: "Easy", topic: "Arrays & Sliding Window" },
      { id: "lc-217", title: "Contains Duplicate", url: "https://leetcode.com/problems/contains-duplicate/", platform: "LeetCode", difficulty: "Easy", topic: "Arrays & Hash Set" },
      { id: "lc-238", title: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self/", platform: "LeetCode", difficulty: "Medium", topic: "Arrays & Prefix Sum" },
      { id: "lc-53", title: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming & Kadane" },
      { id: "lc-152", title: "Maximum Product Subarray", url: "https://leetcode.com/problems/maximum-product-subarray/", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming" },
      { id: "lc-153", title: "Find Minimum in Rotated Sorted Array", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", platform: "LeetCode", difficulty: "Medium", topic: "Binary Search" },
      { id: "lc-33", title: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", platform: "LeetCode", difficulty: "Medium", topic: "Binary Search" },
      { id: "lc-15", title: "3Sum", url: "https://leetcode.com/problems/3sum/", platform: "LeetCode", difficulty: "Medium", topic: "Two Pointers & Sorting" },
      { id: "lc-11", title: "Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water/", platform: "LeetCode", difficulty: "Medium", topic: "Two Pointers & Greedy" },
      { id: "lc-3", title: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", platform: "LeetCode", difficulty: "Medium", topic: "Sliding Window" },
      { id: "lc-424", title: "Longest Repeating Character Replacement", url: "https://leetcode.com/problems/longest-repeating-character-replacement/", platform: "LeetCode", difficulty: "Medium", topic: "Sliding Window" },
      { id: "lc-76", title: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/", platform: "LeetCode", difficulty: "Hard", topic: "Sliding Window" },
      { id: "lc-20", title: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/", platform: "LeetCode", difficulty: "Easy", topic: "Stack" },
      { id: "lc-125", title: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome/", platform: "LeetCode", difficulty: "Easy", topic: "Two Pointers & Strings" },
      { id: "lc-206", title: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list/", platform: "LeetCode", difficulty: "Easy", topic: "Linked List" },
      { id: "lc-141", title: "Linked List Cycle", url: "https://leetcode.com/problems/linked-list-cycle/", platform: "LeetCode", difficulty: "Easy", topic: "Fast & Slow Pointers" },
      { id: "lc-21", title: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/", platform: "LeetCode", difficulty: "Easy", topic: "Linked List & Recursion" },
      { id: "lc-23", title: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists/", platform: "LeetCode", difficulty: "Hard", topic: "Heap & Divide and Conquer" },
      { id: "lc-19", title: "Remove Nth Node From End of List", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", platform: "LeetCode", difficulty: "Medium", topic: "Two Pointers" },
      { id: "lc-143", title: "Reorder List", url: "https://leetcode.com/problems/reorder-list/", platform: "LeetCode", difficulty: "Medium", topic: "Linked List" },
      { id: "lc-226", title: "Invert Binary Tree", url: "https://leetcode.com/problems/invert-binary-tree/", platform: "LeetCode", difficulty: "Easy", topic: "Trees & DFS" },
      { id: "lc-104", title: "Maximum Depth of Binary Tree", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", platform: "LeetCode", difficulty: "Easy", topic: "Trees & DFS" },
      { id: "lc-100", title: "Same Tree", url: "https://leetcode.com/problems/same-tree/", platform: "LeetCode", difficulty: "Easy", topic: "Trees & Recursion" },
      { id: "lc-572", title: "Subtree of Another Tree", url: "https://leetcode.com/problems/subtree-of-another-tree/", platform: "LeetCode", difficulty: "Easy", topic: "Trees & DFS" },
      { id: "lc-235", title: "Lowest Common Ancestor of a BST", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", platform: "LeetCode", difficulty: "Medium", topic: "BST" },
      { id: "lc-102", title: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", platform: "LeetCode", difficulty: "Medium", topic: "Trees & BFS" },
      { id: "lc-98", title: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree/", platform: "LeetCode", difficulty: "Medium", topic: "BST & DFS" },
      { id: "lc-230", title: "Kth Smallest Element in a BST", url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", platform: "LeetCode", difficulty: "Medium", topic: "BST & Inorder" },
      { id: "lc-200", title: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/", platform: "LeetCode", difficulty: "Medium", topic: "Graphs & BFS/DFS" },
      { id: "lc-133", title: "Clone Graph", url: "https://leetcode.com/problems/clone-graph/", platform: "LeetCode", difficulty: "Medium", topic: "Graphs & DFS" },
      { id: "lc-207", title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", platform: "LeetCode", difficulty: "Medium", topic: "Topological Sort & Graphs" },
      { id: "lc-70", title: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs/", platform: "LeetCode", difficulty: "Easy", topic: "Dynamic Programming" },
      { id: "lc-322", title: "Coin Change", url: "https://leetcode.com/problems/coin-change/", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming & Knapsack" },
      { id: "lc-300", title: "Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence/", platform: "LeetCode", difficulty: "Medium", topic: "DP & Binary Search" },
      { id: "lc-1143", title: "Longest Common Subsequence", url: "https://leetcode.com/problems/longest-common-subsequence/", platform: "LeetCode", difficulty: "Medium", topic: "2D Dynamic Programming" },
      { id: "lc-139", title: "Word Break", url: "https://leetcode.com/problems/word-break/", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming & Trie" },
      { id: "lc-39", title: "Combination Sum", url: "https://leetcode.com/problems/combination-sum/", platform: "LeetCode", difficulty: "Medium", topic: "Backtracking" },
      { id: "lc-79", title: "Word Search", url: "https://leetcode.com/problems/word-search/", platform: "LeetCode", difficulty: "Medium", topic: "Backtracking & Matrix" },
      { id: "lc-56", title: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals/", platform: "LeetCode", difficulty: "Medium", topic: "Intervals & Sorting" },
    ],
  },
  {
    id: "codolio-striver-sde",
    provider: "codolio",
    title: "Codolio Striver SDE Sheet Essentials",
    category: "Interview Preparation",
    description: "The ultimate interview preparation sheet curated with top questions frequently asked in product company interviews (FAANG/MAANG).",
    sourceUrl: "https://codolio.com",
    items: [
      { id: "striver-1", title: "Set Matrix Zeroes", url: "https://leetcode.com/problems/set-matrix-zeroes/", platform: "LeetCode", difficulty: "Medium", topic: "Arrays & Matrix" },
      { id: "striver-2", title: "Pascal's Triangle", url: "https://leetcode.com/problems/pascals-triangle/", platform: "LeetCode", difficulty: "Easy", topic: "Arrays & Math" },
      { id: "striver-3", title: "Next Permutation", url: "https://leetcode.com/problems/next-permutation/", platform: "LeetCode", difficulty: "Medium", topic: "Arrays & Two Pointers" },
      { id: "striver-4", title: "Kadane's Algorithm (Maximum Subarray)", url: "https://leetcode.com/problems/maximum-subarray/", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming" },
      { id: "striver-5", title: "Sort Colors (0, 1, 2)", url: "https://leetcode.com/problems/sort-colors/", platform: "LeetCode", difficulty: "Medium", topic: "Two Pointers (Dutch National Flag)" },
      { id: "striver-6", title: "Rotate Image", url: "https://leetcode.com/problems/rotate-image/", platform: "LeetCode", difficulty: "Medium", topic: "Matrix & Math" },
      { id: "striver-7", title: "Merge Overlapping Subintervals", url: "https://leetcode.com/problems/merge-intervals/", platform: "LeetCode", difficulty: "Medium", topic: "Intervals & Sorting" },
      { id: "striver-8", title: "Find the Duplicate Number", url: "https://leetcode.com/problems/find-the-duplicate-number/", platform: "LeetCode", difficulty: "Medium", topic: "Binary Search & Floyd Cycle" },
      { id: "striver-9", title: "Search a 2D Matrix", url: "https://leetcode.com/problems/search-a-2d-matrix/", platform: "LeetCode", difficulty: "Medium", topic: "Binary Search" },
      { id: "striver-10", title: "Pow(x, n)", url: "https://leetcode.com/problems/powx-n/", platform: "LeetCode", difficulty: "Medium", topic: "Binary Exponentiation" },
      { id: "striver-11", title: "Majority Element (> n/2 times)", url: "https://leetcode.com/problems/majority-element/", platform: "LeetCode", difficulty: "Easy", topic: "Moore's Voting Algorithm" },
      { id: "striver-12", title: "Majority Element II (> n/3 times)", url: "https://leetcode.com/problems/majority-element-ii/", platform: "LeetCode", difficulty: "Medium", topic: "Moore's Voting Algorithm" },
      { id: "striver-13", title: "Grid Unique Paths", url: "https://leetcode.com/problems/unique-paths/", platform: "LeetCode", difficulty: "Medium", topic: "Combinatorics & DP" },
      { id: "striver-14", title: "Reverse Pairs", url: "https://leetcode.com/problems/reverse-pairs/", platform: "LeetCode", difficulty: "Hard", topic: "Merge Sort & Divide and Conquer" },
      { id: "striver-15", title: "4Sum", url: "https://leetcode.com/problems/4sum/", platform: "LeetCode", difficulty: "Medium", topic: "Two Pointers & Hash Set" },
      { id: "striver-16", title: "Longest Consecutive Sequence", url: "https://leetcode.com/problems/longest-consecutive-sequence/", platform: "LeetCode", difficulty: "Medium", topic: "Hash Set" },
      { id: "striver-17", title: "Largest Subarray with 0 Sum", url: "https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "Prefix Sum & Hash Map" },
      { id: "striver-18", title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water/", platform: "LeetCode", difficulty: "Hard", topic: "Two Pointers & Stack" },
      { id: "striver-19", title: "N-Queens", url: "https://leetcode.com/problems/n-queens/", platform: "LeetCode", difficulty: "Hard", topic: "Backtracking" },
      { id: "striver-20", title: "Sudoku Solver", url: "https://leetcode.com/problems/sudoku-solver/", platform: "LeetCode", difficulty: "Hard", topic: "Backtracking" },
      { id: "striver-21", title: "LRU Cache", url: "https://leetcode.com/problems/lru-cache/", platform: "LeetCode", difficulty: "Medium", topic: "Doubly Linked List & Hash Map" },
      { id: "striver-22", title: "Rotting Oranges", url: "https://leetcode.com/problems/rotting-oranges/", platform: "LeetCode", difficulty: "Medium", topic: "Graphs & Multi-source BFS" },
      { id: "striver-23", title: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", platform: "LeetCode", difficulty: "Hard", topic: "Binary Search" },
      { id: "striver-24", title: "Kth Element of Two Sorted Arrays", url: "https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1307/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "Binary Search" },
      { id: "striver-25", title: "Alien Dictionary", url: "https://www.geeksforgeeks.org/problems/alien-dictionary/1", platform: "GeeksforGeeks", difficulty: "Hard", topic: "Topological Sort & Graph" },
    ],
  },
  {
    id: "codolio-dp-mastery",
    provider: "codolio",
    title: "Codolio Dynamic Programming Master Sheet",
    category: "Advanced Algorithms",
    description: "Complete roadmap of 1D, 2D, Grid, String, Subsequence, and Partition Dynamic Programming patterns.",
    sourceUrl: "https://codolio.com",
    items: [
      { id: "dp-1", title: "Frog Jump", url: "https://www.geeksforgeeks.org/problems/geek-jump/1", platform: "GeeksforGeeks", difficulty: "Easy", topic: "1D Dynamic Programming" },
      { id: "dp-2", title: "House Robber", url: "https://leetcode.com/problems/house-robber/", platform: "LeetCode", difficulty: "Medium", topic: "1D Dynamic Programming" },
      { id: "dp-3", title: "House Robber II (Circular)", url: "https://leetcode.com/problems/house-robber-ii/", platform: "LeetCode", difficulty: "Medium", topic: "1D Dynamic Programming" },
      { id: "dp-4", title: "Ninja's Training (2D DP)", url: "https://www.geeksforgeeks.org/problems/geeks-training/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "2D Dynamic Programming" },
      { id: "dp-5", title: "Minimum Path Sum in Grid", url: "https://leetcode.com/problems/minimum-path-sum/", platform: "LeetCode", difficulty: "Medium", topic: "Grid DP" },
      { id: "dp-6", title: "Triangle Minimum Path", url: "https://leetcode.com/problems/triangle/", platform: "LeetCode", difficulty: "Medium", topic: "Grid DP" },
      { id: "dp-7", title: "Subset Sum Equal To Target", url: "https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "Subsequence DP" },
      { id: "dp-8", title: "Partition Equal Subset Sum", url: "https://leetcode.com/problems/partition-equal-subset-sum/", platform: "LeetCode", difficulty: "Medium", topic: "0/1 Knapsack DP" },
      { id: "dp-9", title: "Coin Change II (Ways to Make Change)", url: "https://leetcode.com/problems/coin-change-ii/", platform: "LeetCode", difficulty: "Medium", topic: "Unbounded Knapsack" },
      { id: "dp-10", title: "0/1 Knapsack Problem", url: "https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "Knapsack DP" },
      { id: "dp-11", title: "Rod Cutting Problem", url: "https://www.geeksforgeeks.org/problems/rod-cutting0840/1", platform: "GeeksforGeeks", difficulty: "Medium", topic: "Unbounded Knapsack" },
      { id: "dp-12", title: "Edit Distance", url: "https://leetcode.com/problems/edit-distance/", platform: "LeetCode", difficulty: "Medium", topic: "String DP" },
      { id: "dp-13", title: "Distinct Subsequences", url: "https://leetcode.com/problems/distinct-subsequences/", platform: "LeetCode", difficulty: "Hard", topic: "String DP" },
      { id: "dp-14", title: "Wildcard Matching", url: "https://leetcode.com/problems/wildcard-matching/", platform: "LeetCode", difficulty: "Hard", topic: "String Matching DP" },
      { id: "dp-15", title: "Best Time to Buy and Sell Stock with Cooldown", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", platform: "LeetCode", difficulty: "Medium", topic: "Stock DP with State Machine" },
      { id: "dp-16", title: "Matrix Chain Multiplication", url: "https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1", platform: "GeeksforGeeks", difficulty: "Hard", topic: "Partition DP" },
      { id: "dp-17", title: "Burst Balloons", url: "https://leetcode.com/problems/burst-balloons/", platform: "LeetCode", difficulty: "Hard", topic: "Partition DP" },
      { id: "dp-18", title: "Palindrome Partitioning II", url: "https://leetcode.com/problems/palindrome-partitioning-ii/", platform: "LeetCode", difficulty: "Hard", topic: "Partition DP" },
    ],
  },
];

async function fetchProvider(url, provider) {
  if (!url) return null;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${provider} catalog request failed`);
  const data = await response.json();
  const list = Array.isArray(data) ? data : (data.sheets || data.collections || data.data || []);
  if (!Array.isArray(list)) throw new Error(`${provider} catalog format is unsupported`);
  return list.map((x, i) => cleanCollection(x, provider, i)).filter(Boolean);
}

async function providerCatalog() {
  if (providerCache.value && providerCache.expires > Date.now()) {
    return providerCache.value;
  }

  const result = {
    collections: BASE_COLLECTIONS.map((x) => ({ ...x, items: [...x.items] })),
    sources: { codolio: "synced", tle: "synced" },
    updatedAt: new Date().toISOString(),
  };

  const tasks = [
    ["codolio", process.env.CODOLIO_SHEETS_API_URL],
    ["tle", process.env.TLE_SHEETS_API_URL],
  ];

  for (const [provider, url] of tasks) {
    if (!url) continue;
    try {
      const collections = await fetchProvider(url, provider);
      if (collections && collections.length > 0) {
        result.collections = result.collections.filter((x) => x.provider !== provider).concat(collections);
        result.sources[provider] = "live_synced";
      }
    } catch {
      // Retain base collections fallback gracefully
      result.sources[provider] = "synced";
    }
  }

  providerCache = { value: result, expires: Date.now() + CACHE_MS };
  return result;
}

async function listCatalog(req, res, next) {
  try {
    res.json(await providerCatalog());
  } catch (e) {
    next(e);
  }
}

async function syncCatalog(req, res, next) {
  try {
    providerCache = { value: null, expires: 0 };
    res.json(await providerCatalog());
  } catch (e) {
    next(e);
  }
}

async function listSheets(req, res, next) {
  try {
    const sheets = await LearningSheet.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ sheets });
  } catch (e) {
    next(e);
  }
}

async function createSheet(req, res, next) {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) {
      res.status(400);
      throw new Error("Sheet title is required");
    }
    const url = safeUrl(req.body.url);
    const source = ["codolio", "tle", "external", "custom"].includes(req.body.source) ? req.body.source : "external";
    const sheet = await LearningSheet.findOneAndUpdate(
      { user: req.user._id, url },
      {
        title,
        url,
        source,
        description: String(req.body.description || "").trim(),
        isBookmarked: req.body.isBookmarked !== false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.status(201).json({ sheet });
  } catch (e) {
    next(e);
  }
}

async function updateSheet(req, res, next) {
  try {
    const patch = {};
    if (req.body.title !== undefined) patch.title = String(req.body.title).trim();
    if (req.body.url !== undefined) patch.url = safeUrl(req.body.url);
    if (req.body.description !== undefined) patch.description = String(req.body.description).trim();
    if (req.body.isBookmarked !== undefined) patch.isBookmarked = Boolean(req.body.isBookmarked);

    const sheet = await LearningSheet.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      patch,
      { new: true, runValidators: true }
    );
    if (!sheet) {
      res.status(404);
      throw new Error("Sheet not found");
    }
    res.json({ sheet });
  } catch (e) {
    next(e);
  }
}

async function deleteSheet(req, res, next) {
  try {
    const sheet = await LearningSheet.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sheet) {
      res.status(404);
      throw new Error("Sheet not found");
    }
    res.json({ message: "Sheet removed" });
  } catch (e) {
    next(e);
  }
}

async function listProgress(req, res, next) {
  try {
    const progress = await LearningSheetProgress.find({ user: req.user._id }).lean();
    res.json({
      progress: progress.map((x) => ({
        collectionId: x.collectionId,
        itemId: x.itemId,
        done: x.done,
        updatedAt: x.updatedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

async function setProgress(req, res, next) {
  try {
    const collectionId = String(req.params.collectionId || "").trim();
    const itemId = String(req.params.itemId || "").trim();
    if (!collectionId || !itemId) {
      res.status(400);
      throw new Error("Collection and item are required");
    }
    const progress = await LearningSheetProgress.findOneAndUpdate(
      { user: req.user._id, collectionId, itemId },
      { done: Boolean(req.body.done) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({
      progress: {
        collectionId: progress.collectionId,
        itemId: progress.itemId,
        done: progress.done,
        updatedAt: progress.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listCatalog,
  syncCatalog,
  listSheets,
  createSheet,
  updateSheet,
  deleteSheet,
  listProgress,
  setProgress,
};