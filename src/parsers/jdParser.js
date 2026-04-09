const { normalizeText, extractSalary, extractExperience } = require("../utils/textUtils");
const { SKILLS } = require("../lib/skillsList");

/**
 * Extract skills from JD text using keyword matching
 */
function extractSkillsFromText(text) {
  const normalized = normalizeText(text);
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

  return [...found];
}

/**
 * Split required vs optional/desired skills based on section headers
 */
function splitRequiredOptional(text) {
  const requiredSection = [];
  const optionalSection = [];

  // Split text into sections
  const sections = text.split(/\n(?=\s*(?:required|must.have|minimum|basic qualifications?|desired|preferred|good to have|nice to have|optional|bonus)[^\n]*\n)/i);

  let currentType = "required";

  for (const section of sections) {
    const header = section.split("\n")[0].toLowerCase();
    if (/desired|preferred|good to have|nice to have|optional|bonus|plus/.test(header)) {
      currentType = "optional";
    } else if (/required|must.have|minimum|basic qualifications?/.test(header)) {
      currentType = "required";
    }

    const skills = extractSkillsFromText(section);
    if (currentType === "required") {
      requiredSection.push(...skills);
    } else {
      optionalSection.push(...skills);
    }
  }

  // If we couldn't split, treat all as required
  if (requiredSection.length === 0) {
    return {
      required: extractSkillsFromText(text),
      optional: []
    };
  }

  // Remove duplicates and overlap
  const reqSet = new Set(requiredSection);
  const optSet = new Set(optionalSection.filter(s => !reqSet.has(s)));

  return {
    required: [...reqSet],
    optional: [...optSet]
  };
}

/**
 * Generate a short summary of the JD (first meaningful paragraph)
 */
function extractAboutRole(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Look for an "about" or "overview" section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (/overview|about|opportunity|description|position overview/.test(line)) {
      // Return next non-empty line(s) up to 300 chars
      const summary = lines.slice(i + 1, i + 4).join(" ");
      if (summary.length > 30) return summary.substring(0, 300);
    }
  }

  // Fallback: return first paragraph-like content
  for (const line of lines) {
    if (line.length > 60 && !/^(•|\*|-|\d+\.)/.test(line)) {
      return line.substring(0, 300);
    }
  }

  return lines[0] || "";
}

/**
 * Main JD parser
 */
function parseJD(jobId, role, text) {
  const salary = extractSalary(text);
  const experience = extractExperience(text);
  const { required, optional } = splitRequiredOptional(text);
  const aboutRole = extractAboutRole(text);

  return {
    jobId,
    role,
    aboutRole,
    salary,
    requiredExperience: experience,
    requiredSkills: required,
    optionalSkills: optional,
    allSkills: [...new Set([...required, ...optional])]
  };
}

module.exports = { parseJD, extractSkillsFromText };
