"use strict";

const letsHelpProvider = require("./letsHelpProvider");
const gfgProvider = require("./gfgProvider");

const DEFAULT_CACHE_TTL_MS = Number(process.env.RESOURCE_CACHE_TTL || 3600) * 1000;

class ResourceService {
  constructor() {
    this.academicCache = null;
    this.treeCache = null;
    this.lastFetched = null;
    this.providerStatus = {
      letsHelp: { status: "unknown", count: 0, lastError: null },
      gfg: { status: "unknown", count: 0, lastError: null },
    };
  }

  isCacheValid() {
    if (!this.academicCache || !this.lastFetched) return false;
    return Date.now() - this.lastFetched < DEFAULT_CACHE_TTL_MS;
  }

  /**
   * Fetch and merge live academic subjects from Let's Help Everyone with GeeksforGeeks tutorials
   */
  async getAcademicHub(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid()) {
      return this.academicCache;
    }

    try {
      // 1. Fetch real subjects from Let's Help Everyone
      let rawSubjects = [];
      try {
        rawSubjects = await letsHelpProvider.getAcademicSubjects();
        this.providerStatus.letsHelp = {
          status: rawSubjects.length > 0 ? "available" : "degraded",
          count: rawSubjects.reduce((acc, s) => acc + (s.totalResources || 0), 0),
          lastError: null,
        };
      } catch (err) {
        console.error("[ResourceService] Let's Help fetch failed:", err.message);
        this.providerStatus.letsHelp = {
          status: "degraded",
          count: 0,
          lastError: err.message,
        };
      }

      // 2. Fetch GFG tutorials
      const gfgTutorials = gfgProvider.getAllTutorials();
      this.providerStatus.gfg = {
        status: "available",
        count: gfgTutorials.length,
        lastError: null,
      };

      // 3. Merge GFG tutorials into matching academic subjects
      let totalGfgMerged = 0;
      const subjects = rawSubjects.map((subj) => {
        const matchingGfg = gfgProvider.getTutorialsForSubject(subj.name);
        const gfgItems = matchingGfg.map((item, idx) => ({
          id: `gfg-${subj.id || subj.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${idx}`,
          title: item.title,
          link: item.sourceUrl,
          description: item.description,
          source: "GeeksforGeeks",
          category: "gfg",
          subject: subj.name,
          year: subj.year,
        }));

        totalGfgMerged += gfgItems.length;

        // Clone categories
        const notes = [...(subj.notes || [])];
        const books = [...(subj.books || [])];
        const youtube = [...(subj.youtube || [])];
        const website = [...(subj.website || [])];
        const exams = [...(subj.exams || [])];
        const roadmap = [...(subj.roadmap || [])];

        const totalResources = notes.length + books.length + youtube.length + website.length + exams.length + roadmap.length + gfgItems.length;

        return {
          ...subj,
          notes,
          books,
          youtube,
          website,
          gfg: gfgItems,
          exams,
          roadmap,
          totalResources,
        };
      });

      // 4. Group by Academic Years
      const year1 = subjects.filter((s) => s.year === 1);
      const year2 = subjects.filter((s) => s.year === 2);
      const year3 = subjects.filter((s) => s.year === 3);

      const totalResourcesCount = subjects.reduce((sum, s) => sum + s.totalResources, 0);

      const hubData = {
        totalSubjects: subjects.length,
        totalResources: totalResourcesCount,
        years: [
          { year: 1, label: "1st Year", count: year1.length, subjects: year1 },
          { year: 2, label: "2nd Year", count: year2.length, subjects: year2 },
          { year: 3, label: "3rd Year", count: year3.length, subjects: year3 },
        ],
        subjects,
        providers: this.providerStatus,
        lastUpdated: new Date().toISOString(),
      };

      this.academicCache = hubData;
      this.lastFetched = Date.now();

      return hubData;
    } catch (err) {
      console.error("[ResourceService] Error building academic hub:", err);
      throw err;
    }
  }

  /**
   * For backwards compatibility with tree endpoints
   */
  async getTree(forceRefresh = false) {
    const hub = await this.getAcademicHub(forceRefresh);

    // Transform academic hub into tree format
    const subjects = hub.subjects.map((subj) => {
      const allResources = [
        ...subj.notes.map((r) => ({ ...r, contentType: "notes", topic: "Lecture & Handwritten Notes" })),
        ...subj.books.map((r) => ({ ...r, contentType: "books", topic: "Textbooks & References" })),
        ...subj.youtube.map((r) => ({ ...r, contentType: "youtube", topic: "Video Playlists" })),
        ...subj.gfg.map((r) => ({ ...r, contentType: "tutorial", topic: "GeeksforGeeks Tutorials" })),
        ...subj.website.map((r) => ({ ...r, contentType: "website", topic: "Official Docs & Websites" })),
        ...subj.exams.map((r) => ({ ...r, contentType: "exam", topic: "Exams & Question Dumps" })),
        ...subj.roadmap.map((r) => ({ ...r, contentType: "roadmap", topic: "Roadmap & Curriculum" })),
      ];

      // Group into topics
      const topicsMap = new Map();
      for (const res of allResources) {
        if (!topicsMap.has(res.topic)) {
          topicsMap.set(res.topic, {
            name: res.topic,
            resourceCount: 0,
            resources: [],
          });
        }
        const t = topicsMap.get(res.topic);
        t.resourceCount += 1;
        t.resources.push({
          id: res.id,
          title: res.title,
          subject: subj.name,
          topic: res.topic,
          description: res.description,
          source: res.source,
          sourceUrl: res.link,
          contentType: res.contentType,
          content: `# ${res.title}\n\n**Subject**: ${subj.name} (${subj.year ? subj.year + " Year" : "CSE"})\n\n**Category**: ${res.topic}\n\n**Source**: ${res.source}\n\n**Description**: ${res.description || "Study material and reference link."}\n\n[Open Original Resource](${res.link})`,
          tags: [subj.name, res.source, res.contentType],
        });
      }

      return {
        id: subj.id,
        name: subj.name,
        year: subj.year,
        description: subj.description,
        totalResources: allResources.length,
        topics: Array.from(topicsMap.values()),
        notes: subj.notes,
        books: subj.books,
        youtube: subj.youtube,
        gfg: subj.gfg,
        website: subj.website,
        exams: subj.exams,
        roadmap: subj.roadmap,
      };
    });

    return {
      totalSubjects: hub.totalSubjects,
      totalResources: hub.totalResources,
      years: hub.years,
      subjects,
      providers: hub.providers,
      lastUpdated: hub.lastUpdated,
    };
  }

  async getBySubject(subjectQuery) {
    const hub = await this.getAcademicHub();
    const clean = String(subjectQuery || "").toLowerCase();
    return hub.subjects.find(
      (s) => s.id === clean || s.name.toLowerCase().includes(clean)
    ) || null;
  }

  async getById(resourceId) {
    const tree = await this.getTree();
    const cleanId = String(resourceId || "").trim();

    for (const subj of tree.subjects) {
      for (const topic of subj.topics) {
        const found = topic.resources.find((r) => r.id === cleanId);
        if (found) {
          const idx = topic.resources.indexOf(found);
          const prev = idx > 0 ? { id: topic.resources[idx - 1].id, title: topic.resources[idx - 1].title } : null;
          const next = idx < topic.resources.length - 1 ? { id: topic.resources[idx + 1].id, title: topic.resources[idx + 1].title } : null;

          return {
            ...found,
            navigation: { prev, next },
          };
        }
      }
    }
    return null;
  }

  async refresh() {
    return this.getTree(true);
  }
}

module.exports = new ResourceService();

