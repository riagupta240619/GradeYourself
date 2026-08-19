"use strict";

const StudyMaterial = require("../models/study-material-model");
const User = require("../models/user-model");

/**
 * POST /api/study-material/upload
 * Uploads study material metadata.
 * In production, the actual file upload would be handled via signed URLs
 * or direct integration with Firebase/S3, but the backend stores the metadata.
 */
async function uploadMaterial(req, res, next) {
  try {
    const { title, fileName, path, subjectId, semesterId, fileType, fileSize, isPublic, tags, description } = req.body;

    if (!title || !fileName || !path || !subjectId) {
      res.status(400);
      throw new Error("Title, fileName, path, and subjectId are required");
    }

    // Verify subject belongs to user
    const subject = await StudyMaterial.findOne({ _id: subjectId });
    // Note: In a full implementation, we'd check SubjectModel ownership

    const material = await StudyMaterial.create({
      user: req.user._id,
      title,
      fileName,
      path,
      subjectId,
      semesterId: semesterId || undefined,
      fileType: fileType || "other",
      fileSize: fileSize || 0,
      isPublic: isPublic || false,
      tags: tags || [],
      description: description || "",
      uploader: req.user.name || "unknown",
    });

    const user = await User.findById(req.user._id);
    res.status(201).json({
      id: material._id,
      title: material.title,
      fileName: material.fileName,
      path: material.path,
      subjectId: material.subjectId,
      semesterId: material.semesterId,
      fileType: material.fileType,
      fileSize: material.fileSize,
      isPublic: material.isPublic,
      downloadCount: material.downloadCount,
      tags: material.tags,
      description: material.description,
      uploadedAt: material.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/study-material
 * Retrieves study materials for the authenticated user.
 * Can be filtered by subjectId, semesterId, or isPublic.
 */
async function getMaterials(req, res, next) {
  try {
    const { subjectId, semesterId, isPublic } = req.query;

    const query = { user: req.user._id };

    if (subjectId && typeof subjectId === "string") {
      query.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === "string") {
      query.semesterId = semesterId;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    const materials = await StudyMaterial.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(materials);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/study-material/:id
 * Retrieves a specific study material by ID.
 */
async function getMaterialById(req, res, next) {
  try {
    const material = await StudyMaterial.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!material) {
      res.status(404);
      throw new Error("Study material not found");
    }

    // Increment download count on view
    material.downloadCount = (material.downloadCount || 0) + 1;
    await material.save();

    res.json(material);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/study-material/:id/visibility
 * Updates the public/private status of study material.
 */
async function updateMaterialVisibility(req, res, next) {
  try {
    const { isPublic } = req.body;

    const material = await StudyMaterial.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isPublic },
      { new: true, runValidators: true }
    );

    if (!material) {
      res.status(404);
      throw new Error("Study material not found");
    }

    res.json({
      id: material._id,
      title: material.title,
      isPublic: material.isPublic,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/study-material/:id/downloads
 * Increments the download count for a material.
 */
async function incrementDownloadCount(req, res, next) {
  try {
    const material = await StudyMaterial.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { downloadCount: 1 } },
      { new: true, runValidators: true }
    );

    if (!material) {
      res.status(404);
      throw new Error("Study material not found");
    }

    res.json({
      id: material._id,
      downloadCount: material.downloadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/study-material/:id
 * Deletes study material.
 */
async function deleteMaterial(req, res, next) {
  try {
    const material = await StudyMaterial.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!material) {
      res.status(404);
      throw new Error("Study material not found");
    }

    res.json({ message: "Study material deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/study-material/search
 * Search materials by tag or title.
 */
async function searchMaterials(req, res, next) {
  try {
    const { q } = req.query;
    const { subjectId, semesterId } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400);
      throw new Error("Search query is required");
    }

    const query = {
      user: req.user._id,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    };

    if (subjectId && typeof subjectId === "string") {
      query.subjectId = subjectId;
    }

    if (semesterId && typeof semesterId === "string") {
      query.semesterId = semesterId;
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