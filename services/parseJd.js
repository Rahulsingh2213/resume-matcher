const salaryPatterns = [
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
    const experiencePatterns = [
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

  const {extractSkillsFromText}=require("../src/parsers/jdParser.js");
function parseJd(jobId,role,text){
try{
  let salary =null 
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) salary= match[0].trim();
  }
 let experience = null;
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes("fresher") ||
          match[0].toLowerCase().includes("entry")) experience= 0;
      // Return the first captured number
      experience= parseFloat(match[1]);
    }
  }


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

  const required= [...reqSet];
  const optional= [...optSet];

  let aboutRole =""

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
      aboutRole = line.substring(0, 300);
    }
  }

  aboutRole = lines[0] || "";

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

}catch(e){
  console.log("Error parsing JD:", e);
}
}
module.exports = {parseJd};
