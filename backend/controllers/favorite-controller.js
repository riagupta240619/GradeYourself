"use strict";

const Favorite = require("../models/favorite-model");

async function listFavorites(req, res, next) {
  try {
    const userId = req.user._id;
    const { itemType } = req.query;

    const query = { user: userId };
    if (itemType) query.itemType = itemType;

    const favorites = await Favorite.find(query).sort({ createdAt: -1 }).lean();
    res.json({ favorites });
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const userId = req.user._id;
    const { itemType, itemId, title, url, category, description, metadata } = req.body;

    if (!itemType || !title) {
      res.status(400);
      throw new Error("itemType and title are required");
    }

    const searchCriteria = { user: userId, itemType };
    if (itemId) {
      searchCriteria.itemId = itemId;
    } else if (url) {
      searchCriteria.url = url;
    } else {
      searchCriteria.title = title;
    }

    const existing = await Favorite.findOne(searchCriteria);
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ isFavorite: false, message: "Removed from favorites" });
    }

    const created = await Favorite.create({
      user: userId,
      itemType,
      itemId: itemId || "",
      title: title.trim(),
      url: url || "",
      category: category || "General",
      description: description || "",
      metadata: metadata || {},
    });

    res.status(201).json({ isFavorite: true, favorite: created, message: "Saved to favorites" });
  } catch (err) {
    next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Favorite.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      res.status(404);
      throw new Error("Favorite item not found");
    }

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFavorites,
  toggleFavorite,
  removeFavorite,
};
