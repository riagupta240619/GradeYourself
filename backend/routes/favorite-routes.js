"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth-middleware");
const c = require("../controllers/favorite-controller");

router.use(verifyToken);

router.get("/", c.listFavorites);
router.post("/toggle", c.toggleFavorite);
router.delete("/:id", c.removeFavorite);

module.exports = router;
