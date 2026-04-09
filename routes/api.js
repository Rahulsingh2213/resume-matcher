const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Scan = require("../src/db/scanModel");


const {jobDesc,pdfParse,matchResumeToJDs}=require("../controllers/parser.controllers")

// Multer setup — store uploads in /tmp
const upload = multer({
  dest: "/tmp/resume-uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF and TXT files are allowed"));
  }
});



router.post("/parse/resume",upload.single("resume"),pdfParse)



router.post("/parse/jd",express.json(),jobDesc)


router.post("/match",upload.single("resume"),matchResumeToJDs)
module.exports = router;
