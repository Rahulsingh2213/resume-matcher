function matchResume(parsedResume, parsedJDs) {
  try{
  const matchingJobs = parsedJDs.map((jd) => {
    const normalizedResume = new Set(
      parsedResume.resumeSkills.map((skill) =>
        skill
          .toLowerCase()
          .replace(/[.\s-]/g, "")
          .trim(),
      ),
    );
    const skillsAnalysis = jd.allSkills.map((skill) => ({
      skill,
      presentInResume: normalizedResume.has(
        skill
          .toLowerCase()
          .replace(/[.\s-]/g, "")
          .trim(),
      ),
    }));

    let matchingScore = 0;
    const matched = skillsAnalysis.filter((s) => s.presentInResume).length;
    matchingScore = Math.round((matched / skillsAnalysis.length) * 100);
    // const matchingScore = calculateScore(skillsAnalysis);

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

   // Sort by score descending
  matchingJobs.sort((a, b) => b.matchingScore - a.matchingScore);


  return {
    name: parsedResume.name,
    email: parsedResume.email,
    phone: parsedResume.phone,
    yearOfExperience: parsedResume.yearOfExperience,
    resumeSkills: parsedResume.resumeSkills,
    matchingJobs
  };
  }catch(error){
    console.log("Error in matching resume:", error);

  }
}

module.exports = {matchResume};


