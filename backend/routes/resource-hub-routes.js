const express=require("express");
const router=express.Router();
const {verifyToken}=require("../middleware/auth-middleware");
const c=require("../controllers/resource-hub-controller");
router.get("/catalog",c.catalog);
router.get("/saved",verifyToken,c.listBookmarks);
router.post("/saved",verifyToken,c.saveBookmark);
router.delete("/saved/:id",verifyToken,c.deleteBookmark);
module.exports=router;