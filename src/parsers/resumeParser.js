const fs = require("fs");
const path = require("path");
const { normalizeText, extractExperience, extractName } = require("../utils/textUtils");
const { extractSkillsFromText } = require("./jdParser");

/**
 * Calculate total years of experience from date ranges in resume
 * e.g. "Jan 2019 - Mar 2023" or "2018 - Present"
 */
function calculateExperienceFromDates(text) {
  const now = new Date();
  let totalMonths = 0;

  // Match date ranges: Month Year - Month Year / Present
  const dateRangePattern =
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})\s*[-–to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})|present|current|till\s*date)/gi;

  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  let match;
  const ranges = [];

  while ((match = dateRangePattern.exec(text)) !== null) {
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
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());

    if (months > 0 && months < 600) {
      ranges.push({ start: startDate, end: endDate, months });
    }
  }

  // Also try year-only ranges: 2018 - 2022
  const yearRangePattern = /\b(\d{4})\s*[-–]\s*(\d{4}|present|current)\b/gi;
  while ((match = yearRangePattern.exec(text)) !== null) {
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
        months
      });
    }
  }

  if (ranges.length === 0) return null;

  // Sum unique non-overlapping months (simple approach: take max span)
  ranges.sort((a, b) => a.start - b.start);
  totalMonths = ranges.reduce((sum, r) => sum + r.months, 0);

  // Cap at reasonable value and convert to years
  return Math.min(parseFloat((totalMonths / 12).toFixed(1)), 40);
}

/**
 * Extract contact info (email, phone)
 */
function extractContact(text) {
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
  const phone = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || null;
  return { email, phone };
}

/**
 * Main resume parser — accepts plain text
 */
function parseResumeText(text) {
  const name = extractName(text);
  const skills = extractSkillsFromText(text);
  const contact = extractContact(text);

  // Try explicit mention first, then calculate from dates
  let experience = extractExperience(text);
  if (experience === null) {
    experience = calculateExperienceFromDates(text);
  }

  return {
    name,
    email: contact.email,
    phone: contact.phone,
    yearOfExperience: experience,
    resumeSkills: skills
  };
}

/**
 * Clean raw PDF-extracted text (fix spacing, ligatures, line breaks)
 */
function cleanPDFText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Fix common PDF ligature replacements
    .replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl").replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi").replace(/ﬄ/g, "ffl")
    // Remove null bytes and weird control chars
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Fix cases where words are split across lines with a hyphen
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // Normalize whitespace within lines (but not newlines)
    .split("\n").map(l => l.replace(/\s{2,}/g, " ").trim()).join("\n")
    .trim();
}

/**
 * Parse resume from PDF file using pdf-parse
 */
async function parseResumePDF(filePath) {
  const pdfParse = require("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const cleaned = cleanPDFText(data.text);
  return parseResumeText(cleaned);
}

module.exports = { parseResumeText, parseResumePDF };
