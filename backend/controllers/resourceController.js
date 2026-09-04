"use strict";

const resourceService = require("../services/resources/resourceService");
const ResourceBookmark = require("../models/resource-bookmark-model");

/**
 * GET /api/resources
 * Returns the hierarchical Subject -> Topic -> Resource tree
 */
async function getTree(req, res) {
  try {
    const force = req.query.force === "true" || req.query.refresh === "true";
    const tree = await resourceService.getTree(force);
    res.json(tree);
  } catch (err) {
    console.error("[ResourceController] getTree error:", err);
    res.status(500).json({
      message: "Unable to load study resources. Please try again.",
      error: err.message,
    });
  }
}


/**
 * GET /api/resources/subject/:subject
 */
async function getBySubject(req, res) {
  try {
    const { subject } = req.params;
    const data = await resourceService.getBySubject(subject);
    if (!data) {
      return res.status(404).json({ message: `Subject '${subject}' not found.` });
    }
    res.json(data);
  } catch (err) {
    console.error("[ResourceController] getBySubject error:", err);
    res.status(500).json({ message: "Error fetching subject resources.", error: err.message });
  }
}

/**
 * GET /api/resources/subject/:subject/topic/:topic
 */
async function getByTopic(req, res) {
  try {
    const { subject, topic } = req.params;
    const data = await resourceService.getByTopic(subject, topic);
    if (!data) {
      return res.status(404).json({ message: `Topic '${topic}' in subject '${subject}' not found.` });
    }
    res.json(data);
  } catch (err) {
    console.error("[ResourceController] getByTopic error:", err);
    res.status(500).json({ message: "Error fetching topic resources.", error: err.message });
  }
}

/**
 * GET /api/resources/:id
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const resource = await resourceService.getById(id);
    if (!resource) {
      return res.status(404).json({
        message: "Resource not found. The original resource may still be accessible via search.",
      });
    }
    res.json(resource);
  } catch (err) {
    console.error("[ResourceController] getById error:", err);
    res.status(500).json({ message: "Error fetching resource details.", error: err.message });
  }
}

/**
 * POST /api/resources/refresh
 */
async function refresh(req, res) {
  try {
    const updatedTree = await resourceService.refresh();
    res.json({
      message: "Resources refreshed successfully.",
      ...updatedTree,
    });
  } catch (err) {
    console.error("[ResourceController] refresh error:", err);
    res.status(500).json({ message: "Failed to refresh resources from providers.", error: err.message });
  }
}

/**
 * Bookmarks: list, save, delete
 */
async function listBookmarks(req, res) {
  try {
    const bookmarks = await ResourceBookmark.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ bookmarks });
  } catch (err) {
    console.error("[ResourceController] listBookmarks error:", err);
    res.status(500).json({ message: "Unable to load saved bookmarks." });
  }
}

async function saveBookmark(req, res) {
  try {
    const { title, url, category, source, description, resourceId } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: "Title and URL are required." });
    }

    const bookmark = await ResourceBookmark.findOneAndUpdate(
      { user: req.user._id, url },
      {
        user: req.user._id,
        title,
        url,
        category: category || "General",
        source: source || "External",
        description: description || "",
        resourceId: resourceId || "",
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ bookmark, message: "Resource saved to your bookmarks." });
  } catch (err) {
    console.error("[ResourceController] saveBookmark error:", err);
    res.status(500).json({ message: "Unable to save bookmark." });
  }
}

async function deleteBookmark(req, res) {
  try {
    const { id } = req.params;
    await ResourceBookmark.findOneAndDelete({ _id: id, user: req.user._id });
    res.json({ message: "Bookmark removed." });
  } catch (err) {
    console.error("[ResourceController] deleteBookmark error:", err);
    res.status(500).json({ message: "Unable to remove bookmark." });
  }
}

/**
 * Backward compatibility for legacy catalog endpoints
 */
async function legacyCatalog(req, res) {
  try {
    const tree = await resourceService.getTree(false);
    // Flatten subjects to match legacy format if needed
    const subjects = tree.subjects.map((s) => ({
      id: s.id,
      title: s.name,
      description: s.description,
      resources: s.topics.flatMap((t) =>
        t.resources.map((r) => ({
          id: r.id,
          title: r.title,
          provider: r.source,
          url: r.sourceUrl,
          description: r.description,
          embed: false, // No iframes
        }))
      ),
    }));

    res.json({
      subjects,
      providers: [
        { id: "letshelp", name: "Let's Help Everyone", mode: "public-api" },
        { id: "gfg", name: "GeeksforGeeks", mode: "curriculum" },
      ],
      totalResources: tree.totalResources,
    });
  } catch (err) {
    console.error("[ResourceController] legacyCatalog error:", err);
    res.status(500).json({ message: "Unable to load catalog." });
  }
}

module.exports = {
  getTree,
  getBySubject,
  getByTopic,
  getById,
  refresh,
  listBookmarks,
  saveBookmark,
  deleteBookmark,
  legacyCatalog,
};
