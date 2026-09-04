"use strict";
const express=require("express");
const router=express.Router();
const {verifyToken}=require("../middleware/auth-middleware");
const c=require("../controllers/learning-sheet-controller");

router.get("/catalog",c.listCatalog);
router.post("/catalog/sync",c.syncCatalog);
router.use(verifyToken);
router.get("/progress",c.listProgress);
router.put("/progress/:collectionId/:itemId",c.setProgress);
router.get("/",c.listSheets);
router.post("/",c.createSheet);
router.patch("/:id",c.updateSheet);
router.delete("/:id",c.deleteSheet);
module.exports=router;