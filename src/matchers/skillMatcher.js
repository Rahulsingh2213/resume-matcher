
function normalizeSkill(skill) {
  return skill
    .toLowerCase()
    .replace(/[.\s-]/g, "")
    .trim();
}


function analyzeSkills(jdSkills, resumeSkills) {
  const normalizedResume = new Set(resumeSkills.map(normalizeSkill));

  return jdSkills.map((skill) => ({
    skill,
    presentInResume: normalizedResume.has(normalizeSkill(skill)),
  }));
}


function calculateScore(skillsAnalysis) {
  if (!skillsAnalysis || skillsAnalysis.length === 0) return 0;
  const matched = skillsAnalysis.filter((s) => s.presentInResume).length;
  return Math.round((matched / skillsAnalysis.length) * 100);
}


function matchResumeToJDs(parsedResume, parsedJDs) {
  try {
    const matchingJobs = parsedJDs.map((jd) => {
      const skillsAnalysis = analyzeSkills(
        jd.allSkills,
        parsedResume.resumeSkills,
      );
      const matchingScore = calculateScore(skillsAnalysis);

      return {
        jobId: jd.jobId,
        role: jd.role,
        salary: jd.salary,
        requiredExperience: jd.requiredExperience,
        aboutRole: jd.aboutRole,
        skillsAnalysis,
        matchingScore,
      };
    });

    
    matchingJobs.sort((a, b) => b.matchingScore - a.matchingScore);

    return {
      name: parsedResume.name,
      email: parsedResume.email,
      phone: parsedResume.phone,
      yearOfExperience: parsedResume.yearOfExperience,
      resumeSkills: parsedResume.resumeSkills,
      matchingJobs,
    };
  } catch (e) {
    console.log("Error in matchResumeToJDs:", e);
  }
}

module.exports = { analyzeSkills, calculateScore, matchResumeToJDs };
