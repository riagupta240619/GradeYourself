"use strict";

const CentralResource = require("../models/study-material-model");
const User = require("../models/user-model");

/**
 * POST /api/resources/upload
 * Uploads resource metadata.
 * Supports all resource types: pdf, ppt, markdown, note, external_link, github_file, etc.
 */
async function uploadResource(req, res, next) {
  try {
    const { 
      title, 
      fileName, 
      path, 
      subjectId, 
      semesterId, 
      fileType, 
      fileSize, 
      visibility,
      type,
      source,
      externalUrl,
      githubFullName,
      githubPath,
      youtubeId,
      youtubePlaylistId,
      tags,
      description,
      metadata
    } = req.body;

    if (!title) {
      res.status(400);
      throw new Error("Title is required");
    }

    // Validate required fields based on type
    const resourceType = type || "pdf";
    if (["pdf", "ppt", "image", "text", "other"].includes(resourceType)) {
      if (!fileName || !path) {
        res.status(400);
        throw new Error("fileName and path are required for file uploads");
      }
    }
    if (resourceType === "external_link" && !externalUrl) {
      res.status(400);
      throw new Error("externalUrl is required for external links");
    }
    if (["github_file", "github_repo"].includes(resourceType) && !githubFullName) {
      res.status(400);
      throw new Error("githubFullName is required for GitHub resources");
    }
    if (resourceType === "youtube_video" && !youtubeId) {
      res.status(400);
      throw new Error("youtubeId is required for YouTube videos");
    }
    if (resourceType === "youtube_playlist" && !youtubePlaylistId) {
      res.status(400);
      throw new Error("youtubePlaylistId is required for YouTube playlists");
    }

    const resource = await CentralResource.create({
      user: req.user._id,
      title,
      fileName: fileName || "",
      path: path || "",
      subjectId: subjectId || undefined,
      semesterId: semesterId || undefined,
      fileType: fileType || "other",
      fileSize: fileSize || 0,
      visibility: visibility || "private",
      type: resourceType,
      source: source || "user_upload",
      externalUrl: externalUrl || "",
      githubFullName: githubFullName || "",
      githubPath: githubPath || "",
      youtubeId: youtubeId || "",
      youtubePlaylistId: youtubePlaylistId || "",
      tags: tags || [],
      description: description || "",
      metadata: metadata || {},
      uploader: req.user.name || "unknown",
    });

    const user = await User.findById(req.user._id);
    res.status(201).json({
      id: resource._id,
      title: resource.title,
      fileName: resource.fileName,
      path: resource.path,
      subjectId: resource.subjectId,
      semesterId: resource.semesterId,
      fileType: resource.fileType,
      fileSize: resource.fileSize,
      visibility: resource.visibility,
      type: resource.type,
      source: resource.source,
      externalUrl: resource.externalUrl,
      githubFullName: resource.githubFullName,
      githubPath: resource.githubPath,
      youtubeId: resource.youtubeId,
      youtubePlaylistId: resource.youtubePlaylistId,
      downloadCount: resource.downloadCount,
      viewCount: resource.viewCount,
      tags: resource.tags,
      description: resource.description,
      metadata: resource.metadata,
      uploadedAt: resource.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources
 * Retrieves resources for the authenticated user.
 * Can be filtered by subjectId, semesterId, type, source, visibility.
 */
async function getResources(req, res, next) {
  try {
    const { subjectId, semesterId, type, source, visibility, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (subjectId && typeof subjectId === "string") {
      query.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === "string") {
      query.semesterId = semesterId;
    }

    if (type && typeof type === "string") {
      query.type = type;
    }

    if (source && typeof source === "string") {
      query.source = source;
    }

    if (visibility !== undefined) {
      query.visibility = visibility === "true" ? "public" : visibility;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const resources = await CentralResource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await CentralResource.countDocuments(query);

    res.json({
      resources,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources/:id
 * Retrieves a specific resource by ID.
 */
async function getResourceById(req, res, next) {
  try {
    const resource = await CentralResource.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

    // Increment view count on view
    await CentralResource.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json(resource);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/resources/:id/visibility
 * Updates the visibility of a resource.
 */
async function updateResourceVisibility(req, res, next) {
  try {
    const { visibility } = req.body;

    if (!["public", "unlisted", "private"].includes(visibility)) {
      res.status(400);
      throw new Error("Invalid visibility value. Must be: public, unlisted, or private");
    }

    const resource = await CentralResource.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { visibility },
      { new: true, runValidators: true }
    );

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

    res.json({
      id: resource._id,
      title: resource.title,
      visibility: resource.visibility,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/resources/:id/downloads
 * Increments the download count for a resource.
 */
async function incrementDownloadCount(req, res, next) {
  try {
    const resource = await CentralResource.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { downloadCount: 1 } },
      { new: true, runValidators: true }
    );

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

    res.json({
      id: resource._id,
      downloadCount: resource.downloadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/resources/:id
 * Deletes resource.
 */
async function deleteResource(req, res, next) {
  try {
    const resource = await CentralResource.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

    res.json({ message: "Resource deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources/search
 * Search resources by title, tags, or description.
 */
async function searchResources(req, res, next) {
  try {
    const { q, subjectId, semesterId, type, source, page = 1, limit = 20 } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400);
      throw new Error("Search query is required");
    }

    const query = {
      user: req.user._id,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    if (subjectId && typeof subjectId === "string") {
      query.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === "string") {
      query.semesterId = semesterId;
    }

    if (type && typeof type === "string") {
      query.type = type;
    }

    if (source && typeof source === "string") {
      query.source = source;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const resources = await CentralResource.find(query)
      .sort({ downloadCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await CentralResource.countDocuments(query);

    res.json({
      resources,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources/public
 * Public resource browsing (no auth required).
 * Shows only public visibility resources.
 */
async function getPublicResources(req, res, next) {
  try {
    const { subject, topic, type, source, tags, page = 1, limit = 20 } = req.query;

    const query = { visibility: "public" };

    if (subject && typeof subject === "string") {
      query["metadata.subject"] = { $regex: subject, $options: "i" };
    }

    if (topic && typeof topic === "string") {
      query["metadata.topic"] = { $regex: topic, $options: "i" };
    }

    if (type && typeof type === "string") {
      query.type = type;
    }

    if (source && typeof source === "string") {
      query.source = source;
    }

    if (tags && typeof tags === "string") {
      const tagArray = tags.split(",").map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const resources = await CentralResource.find(query)
      .sort({ downloadCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await CentralResource.countDocuments(query);

    res.json({
      resources,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/resources/stats
 * Get resource statistics for the user.
 */
async function getResourceStats(req, res, next) {
  try {
    const userId = req.user._id;

    const [total, byType, byVisibility, storageUsed] = await Promise.all([
      CentralResource.countDocuments({ user: userId }),
      CentralResource.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      CentralResource.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$visibility", count: { $sum: 1 } } },
      ]),
      CentralResource.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
      ]),
    ]);

    res.json({
      totalResources: total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byVisibility: byVisibility.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      storageUsed: storageUsed[0]?.totalSize || 0,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadResource,
  getResources,
  getResourceById,
  updateResourceVisibility,
  incrementDownloadCount,
  deleteResource,
  searchResources,
  getPublicResources,
  getResourceStats,
};

/**
 * GET /api/materials
 * Retrieves materials for the authenticated user.
 * Can be filtered by subjectId, semesterId, type, source, tags.
 */
async function getMaterials(req, res, next) {
  try {
    const { subjectId, semesterId, type, source, tags } = req.query;

    const query = { user: req.user._id };

    if (subjectId && typeof subjectId === "string") {
      query.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === "string") {
      query.semesterId = semesterId;
    }

    if (type && typeof type === "string") {
      query.type = type;
    }

    if (source && typeof source === "string") {
      query.source = source;
    }

    if (tags && typeof tags === "string") {
      const tagArray = tags.split(",").map(t => t.trim());
      query.tags = { $in: tagArray };
    }

    const materials = await StudyMaterial.find(query)
      .sort({ downloadCount: -1 })
      .limit(20)
      .lean();

    res.json(materials);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  updateMaterialVisibility,
  incrementDownloadCount,
  deleteMaterial,
  searchMaterials,
};