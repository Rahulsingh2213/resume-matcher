const fs = require("fs");
const { SKILLS } = require("../src/lib/skillsList");

const patterns = [
  // "5+ years", "3-5 years", "7 years of experience"
  /(\d+)\+?\s*(?:to|-)\s*(\d+)\+?\s*years?(?:\s*of\s*(?:relevant\s*)?experience)?/i,
  /(\d+)\+?\s*years?\s*(?:of\s*(?:relevant\s*|related\s*)?experience|experience)/i,
  // "Bachelor's with 5+ years"
  /(?:bachelor|master|phd)[^\n]*?(\d+)\+?\s*years?/i,
  // "fresher" / "entry level"
  /\b(fresher|entry.?level)\b/i,
  // "2+ years of programming"
  /(\d+)\+?\s*years?\s*of\s*programming/i,
];

const parsePdf = async (filePath) => {
  try {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const cleaned = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/ﬁ/g, "fi")
      .replace(/ﬂ/g, "fl")
      .replace(/ﬀ/g, "ff")
      .replace(/ﬃ/g, "ffi")
      .replace(/ﬄ/g, "ffl")
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/(\w)-\n(\w)/g, "$1$2")
      .split("\n")
      .map((l) => l.replace(/\s{2,}/g, " ").trim())
      .join("\n")
      .trim();

    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let name = "Unknown";
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){1,3}$/.test(line)) {
        name = line;
        break;
      }
    }
    if (name === "Unknown") {
      const nameMatch = data.text.match(
        /(?:name\s*[:\-]\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i,
      );
      if (nameMatch) name = nameMatch[1];
    }

    const normalized = data.text.toLowerCase().replace(/\s+/g, " ").trim();
    const found = new Set();
    // Sort skills by length descending to match longer phrases first (e.g. "spring boot" before "spring")
    const sortedSkills = [...SKILLS].sort((a, b) => b.length - a.length);

    for (const skill of sortedSkills) {
      // Use word boundary matching
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
      if (regex.test(normalized)) {
        found.add(skill.toLowerCase());
      }
    }

    const skills = [...found];
    const email =
      data.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ||
      null;
    const phone =
      data.text.match(
        /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      )?.[0] || null;
    let experience = null;
    for (const pattern of patterns) {
      const match = data.text.match(pattern);
      if (match) {
        if (
          match[0].toLowerCase().includes("fresher") ||
          match[0].toLowerCase().includes("entry")
        ) {
          experience = 0;
        }
        // Return the first captured number
        experience = parseFloat(match[1]);
      }
    }
    if (experience === null) {
      const now = new Date();
      let totalMonths = 0;

      // Match date ranges: Month Year - Month Year / Present
      const dateRangePattern =
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})\s*[-–to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})|present|current|till\s*date)/gi;

      const monthMap = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      let match;
      const ranges = [];

      while ((match = dateRangePattern.exec(data.text)) !== null) {
        const startYear = parseInt(match[1]);
        const startMonthStr = match[0].substring(0, 3).toLowerCase();
        const startMonth = monthMap[startMonthStr] ?? 0;

        let endDate;
        if (!match[2] || /present|current|till/i.test(match[0])) {
          endDate = now;
        } else {
          const endYear = parseInt(match[2]);
          endDate = new Date(endYear, 0);
        }

        const startDate = new Date(startYear, startMonth);
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());

        if (months > 0 && months < 600) {
          ranges.push({ start: startDate, end: endDate, months });
        }
      }

      // Also try year-only ranges: 2018 - 2022
      const yearRangePattern = /\b(\d{4})\s*[-–]\s*(\d{4}|present|current)\b/gi;
      while ((match = yearRangePattern.exec(data.text)) !== null) {
        const startYear = parseInt(match[1]);
        if (startYear < 1990 || startYear > now.getFullYear()) continue;

        const endYear = /present|current/i.test(match[2])
          ? now.getFullYear()
          : parseInt(match[2]);

        const months = (endYear - startYear) * 12;
        if (months > 0 && months < 600) {
          ranges.push({
            start: new Date(startYear, 0),
            end: new Date(endYear, 0),
            months,
          });
        }
      }
      if (ranges.length === 0) return null;
      ranges.sort((a, b) => a.start - b.start);
      totalMonths = ranges.reduce((sum, r) => sum + r.months, 0);

      experience = Math.min(parseFloat((totalMonths / 12).toFixed(1)), 40);
    }

    return{
      name,
      email,
      phone,
      yearOfExperience: experience,
      resumeSkills: skills,
    };
  } catch (err) {
    console.error("Error parsing PDF:", err);
  }
};

module.exports = {parsePdf};


