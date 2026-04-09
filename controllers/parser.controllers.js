
const { parseResumeText, parseResumePDF } = require("../src/parsers/resumeParser");
const { parsePdf } = require("../services/parsePdf");
// const { matchResumeToJDs } = require("../src/matchers/skillMatcher");
const {parseJd}=require("../services/parseJd");
const {matchResume}=require("../services/matchResume");
const path = require("path");
const fs = require("fs");
 async function pdfParse(req,res){
    try {
    let parsed;

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === ".pdf") {
        parsed = await parsePdf(req.file.path);
      } else {
        const text = fs.readFileSync(req.file.path, "utf-8");
        parsed = parseResumeText(text);
      }
      fs.unlinkSync(req.file.path); // cleanup
    } else if (req.body?.text) {
      parsed = parseResumeText(req.body.text);
    } else {
      return res.status(400).json({ error: "Provide a resume file or text body" });
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.log("Error in pdfParse:", err);
    res.status(500).json({ error: err.message });
  }
};

 const jobDesc = (req,res)=>{
    try {
        const { jobId, role, text } = req.body;
    if (!text) return res.status(400).json({ error: "JD text is required" });

    const parsed = parseJd(
      jobId || "JD001",
      role || "Software Engineer",
      text
    );
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.log("Error in jobDesc:", err);
    res.status(500).json({ error: err.message });
  }
};

 const matchResumeToJDs = async(req,res)=>{
    try {
        let parsedResume;
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      parsedResume = ext === ".pdf"
        ? await parsePdf(req.file.path)
        : parseResumeText(fs.readFileSync(req.file.path, "utf-8"));
      fs.unlinkSync(req.file.path);
    } else if (req.body?.resumeText) {
      parsedResume = parseResumeText(req.body.resumeText);
    } else {
      return res.status(400).json({ error: "Provide a resume file or resumeText" });
    }

    // console.log("Parsed Resume:", parsedResume);
    // Parse JDs
    const jdsRaw = req.body?.jds;
    if (!jdsRaw) return res.status(400).json({ error: "jds field is required" });

    let jdList;
    try {
      jdList = typeof jdsRaw === "string" ? JSON.parse(jdsRaw) : jdsRaw;
    } catch {
      return res.status(400).json({ error: "jds must be a valid JSON array" });
    }

    if (!Array.isArray(jdList) || jdList.length === 0) {
      return res.status(400).json({ error: "jds must be a non-empty array" });
    }

    const parsedJDs = jdList.map(jd => parseJd(jd.jobId, jd.role, jd.text));

    console.dir({ parsedResume, parsedJDs }, { depth: null });
    // Match
    const result = matchResume(parsedResume, parsedJDs);
    console.dir({ matchResult: result }, { depth: null });
    res.json({ success: true, data: result });
  } catch (err) {
    console.log("Error in matchResumeToJDs:", err);
    res.status(500).json({ error: err.message });
  }
};



module.exports = { pdfParse, jobDesc, matchResumeToJDs };