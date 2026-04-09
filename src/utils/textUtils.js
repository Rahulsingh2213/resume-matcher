/**
 * Normalize text: lowercase, remove extra whitespace
 */
function normalizeText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Extract salary from text
 * Handles: $180,000 - $220,000 | 12 LPA | ₹10,00,000 | 61087 - 104364
 */
function extractSalary(text) {
  const patterns = [
    // $120,000 - $170,000 / year
    /\$[\d,]+(?:\.\d+)?\s*[-–to]+\s*\$[\d,]+(?:\.\d+)?(?:\s*(?:per\s*year|\/year|annually))?/gi,
    // $58.65/hour to $181,000/year
    /\$[\d,]+(?:\.\d+)?\s*(?:\/hour|\/yr|per\s*year|annually)/gi,
    // 12 LPA / 10 LPA
    /\d+(?:\.\d+)?\s*lpa/gi,
    // ₹10,00,000
    /₹[\d,]+(?:\s*(?:per\s*annum|pa|lpa))?/gi,
    // plain range like 61087 - 104364 (only if near salary keyword)
    /(?:salary|compensation|pay|ctc)[^\n]*?[\d,]{5,}\s*[-–]\s*[\d,]{5,}/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

/**
 * Extract years of experience from text
 */
function extractExperience(text) {
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

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes("fresher") ||
          match[0].toLowerCase().includes("entry")) return 0;
      // Return the first captured number
      return parseFloat(match[1]);
    }
  }
  return null;
}


function extractName(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // A name is typically 2-4 words, no digits, no special chars
    if (/^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){1,3}$/.test(line)) {
      return line;
    }
  }

  // Fallback: look for "Name: John Doe"
  const nameMatch = text.match(/(?:name\s*[:\-]\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i);
  if (nameMatch) return nameMatch[1];

  return lines[0] || "Unknown";
}

module.exports = { normalizeText, extractSalary, extractExperience, extractName };
