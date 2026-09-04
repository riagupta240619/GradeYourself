"use strict";

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const StorageFile = require("../models/storage-file-model");
const StorageFolder = require("../models/storage-folder-model");
const Favorite = require("../models/favorite-model");

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

// Base upload path
const UPLOAD_ROOT = path.join(__dirname, "../uploads/storage");
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// Multer storage engine with per-user directory isolation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_ROOT, String(req.user._id));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

function serialize(file) {
  return {
    _id: file._id,
    name: file.name,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    storageKey: file.storageKey,
    folder: file.folder,
    isFavorite: file.isFavorite,
    isDeleted: file.isDeleted,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    lastOpenedAt: file.lastOpenedAt,
    downloadUrl: `/api/storage/files/${file._id}/content`,
  };
}

/**
 * POST /api/storage/upload
 */
async function upload(req, res, next) {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const { folderId, customName } = req.body;
    let targetFolder = null;
    if (folderId && folderId !== "root") {
      const folderExists = await StorageFolder.findOne({
        _id: folderId,
        user: req.user._id,
        isDeleted: false,
      });
      if (folderExists) {
        targetFolder = folderExists._id;
      }
    }

    const fileDoc = await StorageFile.create({
      user: req.user._id,
      name: customName?.trim() || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      storageKey: req.file.filename,
      provider: "local",
      providerUrl: req.file.path,
      folder: targetFolder,
    });

    res.status(201).json({ file: serialize(fileDoc) });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/storage/files/:id/content
 * Stream or download file content
 */
async function download(req, res, next) {
  try {
    const file = await StorageFile.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }

    const filePath =
      file.providerUrl ||
      path.join(UPLOAD_ROOT, String(req.user._id), file.storageKey);

    if (!fs.existsSync(filePath)) {
      res.status(404);
      throw new Error("File binary not found on disk");
    }

    file.lastOpenedAt = new Date();
    await file.save();

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      req.query.download === "true"
        ? `attachment; filename="${encodeURIComponent(file.name)}"`
        : `inline; filename="${encodeURIComponent(file.name)}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/storage/files
 */
async function list(req, res, next) {
  try {
    const view = String(req.query.view || "files");
    const query = { user: req.user._id, isDeleted: view === "trash" };

    if (view === "favorites") {
      query.isFavorite = true;
      query.isDeleted = false;
    }

    if (view === "files" && req.query.folder !== undefined) {
      query.folder = req.query.folder === "root" || !req.query.folder ? null : req.query.folder;
    }

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const sortOrder =
      view === "recent"
        ? { lastOpenedAt: -1, updatedAt: -1 }
        : { updatedAt: -1 };

    const files = await StorageFile.find(query).sort(sortOrder).lean();
    res.json({ files: files.map(serialize) });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/storage/folders
 */
async function folders(req, res, next) {
  try {
    const parent = req.query.parent || null;
    const query = { user: req.user._id, isDeleted: false };
    if (parent !== undefined) {
      query.parentFolder = parent === "all" ? undefined : parent === "root" ? null : parent;
      if (query.parentFolder === undefined) delete query.parentFolder;
    }

    const folderList = await StorageFolder.find(query).sort({ name: 1 }).lean();
    res.json({ folders: folderList });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/storage/folders
 */
async function createFolder(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      res.status(400);
      throw new Error("Folder name is required");
    }

    let parentFolder = req.body.parentFolder || null;
    if (parentFolder === "root") parentFolder = null;

    if (parentFolder) {
      const exists = await StorageFolder.exists({
        _id: parentFolder,
        user: req.user._id,
        isDeleted: false,
      });
      if (!exists) {
        res.status(404);
        throw new Error("Parent folder not found");
      }
    }

    const folder = await StorageFolder.create({
      user: req.user._id,
      name,
      parentFolder,
    });

    res.status(201).json({ folder });
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/storage/folders/:id
 */
async function deleteFolder(req, res, next) {
  try {
    const { id } = req.params;
    const folder = await StorageFolder.findOne({
      _id: id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!folder) {
      res.status(404);
      throw new Error("Folder not found");
    }

    // Soft delete the folder
    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();

    // Move child files to root so files are not lost
    await StorageFile.updateMany(
      { folder: id, user: req.user._id },
      { $set: { folder: null } }
    );

    // Update any subfolders to root
    await StorageFolder.updateMany(
      { parentFolder: id, user: req.user._id },
      { $set: { parentFolder: null } }
    );

    res.json({ message: "Folder deleted successfully. Contained files moved to My Storage root." });
  } catch (e) {
    next(e);
  }
}

/**
 * PATCH /api/storage/files/:id
 */
async function patchFile(req, res, next) {
  try {
    const patch = {};
    if (req.body.name !== undefined) {
      patch.name = String(req.body.name).trim().slice(0, 255);
    }
    if (req.body.isFavorite !== undefined) {
      patch.isFavorite = Boolean(req.body.isFavorite);
    }
    if (req.body.folderId !== undefined) {
      const id = req.body.folderId === "root" || !req.body.folderId ? null : req.body.folderId;
      if (id) {
        const target = await StorageFolder.exists({
          _id: id,
          user: req.user._id,
          isDeleted: false,
        });
        if (!target) {
          res.status(404);
          throw new Error("Target folder not found");
        }
      }
      patch.folder = id;
    }

    const file = await StorageFile.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: false },
      patch,
      { new: true }
    );

    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }

    // Sync with universal Favorite system if isFavorite was changed
    if (req.body.isFavorite !== undefined) {
      if (req.body.isFavorite) {
        await Favorite.findOneAndUpdate(
          { user: req.user._id, itemType: "file", itemId: String(file._id) },
          {
            user: req.user._id,
            itemType: "file",
            itemId: String(file._id),
            title: file.name,
            url: `/api/storage/files/${file._id}/content`,
            category: "Storage Files",
            metadata: { size: file.size, mimeType: file.mimeType },
          },
          { upsert: true }
        );
      } else {
        await Favorite.deleteOne({
          user: req.user._id,
          itemType: "file",
          itemId: String(file._id),
        });
      }
    }

    res.json({ file: serialize(file) });
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/storage/files/:id
 */
async function trash(req, res, next) {
  try {
    const file = await StorageFile.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), isFavorite: false },
      { new: true }
    );
    if (!file) {
      res.status(404);
      throw new Error("File not found");
    }
    await Favorite.deleteOne({
      user: req.user._id,
      itemType: "file",
      itemId: String(file._id),
    });
    res.json({ message: "File moved to trash" });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/storage/files/:id/restore
 */
async function restore(req, res, next) {
  try {
    const file = await StorageFile.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!file) {
      res.status(404);
      throw new Error("File not found in trash");
    }
    res.json({ file: serialize(file) });
  } catch (e) {
    next(e);
  }
}

/**
 * DELETE /api/storage/files/:id/permanent
 */
async function permanent(req, res, next) {
  try {
    const file = await StorageFile.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: true,
    });
    if (!file) {
      res.status(404);
      throw new Error("File not found in trash");
    }

    // Remove from disk
    const filePath =
      file.providerUrl ||
      path.join(UPLOAD_ROOT, String(req.user._id), file.storageKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Could not remove physical file:", err);
      }
    }

    res.json({ message: "File permanently deleted" });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/storage/stats
 */
async function stats(req, res, next) {
  try {
    const r = await StorageFile.aggregate([
      { $match: { user: req.user._id, isDeleted: false } },
      { $group: { _id: null, used: { $sum: "$size" }, count: { $sum: 1 } } },
    ]);
    const folderCount = await StorageFolder.countDocuments({
      user: req.user._id,
      isDeleted: false,
    });
    const linkCount = await Favorite.countDocuments({
      user: req.user._id,
      itemType: "link",
    });

    res.json({
      usedStorage: r[0]?.used || 0,
      fileCount: r[0]?.count || 0,
      folderCount,
      linkCount,
      totalQuota: 5 * 1024 * 1024 * 1024, // 5 GB
    });
  } catch (e) {
    next(e);
  }
}

/**
 * Saved Links (Feature 2.4)
 */
async function listLinks(req, res, next) {
  try {
    const links = await Favorite.find({
      user: req.user._id,
      itemType: "link",
    }).sort({ createdAt: -1 }).lean();
    res.json({ links });
  } catch (e) {
    next(e);
  }
}

async function createLink(req, res, next) {
  try {
    const { title, url, category, description } = req.body;
    if (!title || !url) {
      res.status(400);
      throw new Error("Title and URL are required");
    }

    const link = await Favorite.create({
      user: req.user._id,
      itemType: "link",
      title: title.trim(),
      url: url.trim(),
      category: (category || "General").trim(),
      description: (description || "").trim(),
    });

    res.status(201).json({ link });
  } catch (e) {
    next(e);
  }
}

async function deleteLink(req, res, next) {
  try {
    const deleted = await Favorite.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      itemType: "link",
    });
    if (!deleted) {
      res.status(404);
      throw new Error("Link not found");
    }
    res.json({ message: "Link deleted successfully" });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  uploadMiddleware,
  upload,
  download,
  list,
  folders,
  createFolder,
  deleteFolder,
  patchFile,
  trash,
  restore,
  permanent,
  stats,
  listLinks,
  createLink,
  deleteLink,
};