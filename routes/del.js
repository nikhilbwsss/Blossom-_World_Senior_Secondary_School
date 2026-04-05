let Del = require("../models/dele");
const express = require("express");
const router = express.Router();
const multer  = require('multer');
const {storage} = require("../cloudConfig.js"); 
const { isLoggedIn } = require("../middleware/middleware");

const upload = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!allowed.has(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, WEBP images are allowed"), false);
        }
        cb(null, true);
    }
});

router.get("/delete", isLoggedIn, (req, res) => {
    res.render("pages/delete");
});

router.post("/listing",
    isLoggedIn,
    upload.single('listing[image]'),
     (req, res) => {
    if (!req.file) {
        req.flash("error", "Image upload is required.");
        return res.redirect("/d/delete");
    }
    let url = req.file.path;
    let filename = req.file.filename;
    const AddDel = new Del(req.body.listing);
    // AddDel.image.url = req.file.path;
    AddDel.image = {url, filename}
    AddDel.save();
    res.redirect("/d/delete");
});

router.get("/listing/show", isLoggedIn, async (req, res) => {
    const listing = await Del.find({});
    res.render("pages/deleteShow", {listings: listing});
});

// router.get("/listing/:id/view")
module.exports = router;
