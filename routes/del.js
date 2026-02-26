let Del = require("../models/dele");
const express = require("express");
const router = express.Router();
const multer  = require('multer');
const {storage} = require("../cloudConfig.js"); 
const upload = multer({storage})

router.get("/delete", (req, res) => {
    res.render("pages/delete");
});

router.post("/listing",
    upload.single('listing[image]'),
     (req, res) => {
    console.log(req.body);
    console.log(req.file);
    console.log("............")
    let url = req.file.path;
    let filename = req.file.filename;
    const AddDel = new Del(req.body.listing);
    // AddDel.image.url = req.file.path;
    AddDel.image = {url, filename}
    const a = AddDel.save()
    res.redirect("/d/delete");
    console.log(a);
});

router.get("/listing/show", async (req, res) => {
    const listing = await Del.find({});
    res.render("pages/deleteShow", {listings: listing});
    console.log(listing);
});

// router.get("/listing/:id/view")
module.exports = router;