"use strict";
const express=require("express");
const router=express.Router();
const {verifyToken}=require("../middleware/auth-middleware");
const c=require("../controllers/learning-sheet-controller");

// Public catalog metadata contains only legitimate first-party links; user saves remain authenticated.
router.get("/catalog",c.listCatalog);
router.use(verifyToken);
router.get("/",c.listSheets);
router.post("/",c.createSheet);
router.patch("/:id",c.updateSheet);
router.delete("/:id",c.deleteSheet);
module.exports=router;