const fs = require("fs");
const path = require("path");

const { parseResumeText } = require("../src/parsers/resumeParser");
const { parseJD } = require("../src/parsers/jdParser");
const { matchResumeToJDs } = require("../src/matchers/skillMatcher");

// ── Load sample resume ──
const resumeText = fs.readFileSync(path.join(__dirname, "resume.txt"), "utf-8");
const parsedResume = parseResumeText(resumeText);

console.log("\n========== PARSED RESUME ==========");
console.log(JSON.stringify(parsedResume, null, 2));

// ── Sample JDs (two from the assignment) ──
const jds = [
  {
    jobId: "JD001",
    role: "Full Stack Engineer (Capgemini)",
    text: `Should have 7 years of strong handson experience with Core Java Spring Boot.
Should have 4 years of strong handson experience with Angular or React.
Hands On experience Relational Database Microsoft SQL Server or No SQL is required.
Should have strong hands on experience working on Microservices Kafka REST API Development.
Hands on experience working with containerization technologies Docker Kubernetes.
Good to have: Python experience, AI/ML exposure, Azure, DevOps pipeline CI/CD Jenkins.
The base compensation range for this role is: 61087 - 104364`
  },
  {
    jobId: "JD002",
    role: "Software Engineer (Astra)",
    text: `3+ years of experience in software engineering, including production-level Python development.
Solid understanding of system design, data pipelines, and APIs.
Experience with cloud-native services (e.g., AWS, Kubernetes, Docker) and telemetry or time-series systems.
Familiarity with REST/gRPC APIs and common data serialization formats (e.g., JSON, YAML, Protobuf).
Desired: TypeScript, Go, C/C++.
The pay range for this role is: $130,000 - $160,000 per year`
  },
  {
    jobId: "JD003",
    role: "Software Engineer (SpaceX Full Stack)",
    text: `5+ years of experience in web applications development.
Expertise in C#, .NET, SQL, HTML, CSS, AngularJS, TypeScript.
Expertise in Python, PostgreSQL.
Experience with CI/CD, unit testing, continuous integration, Docker.
Bachelor's degree in computer science or engineering.
Pay Range: Software Engineer/Level I: $120,000.00 - $145,000.00/per year`
  }
];

// ── Parse JDs ──
const parsedJDs = jds.map(jd => parseJD(jd.jobId, jd.role, jd.text));

console.log("\n========== PARSED JDs ==========");
parsedJDs.forEach(jd => {
  console.log(`\n[${jd.jobId}] ${jd.role}`);
  console.log(`  Salary: ${jd.salary}`);
  console.log(`  Experience: ${jd.requiredExperience} years`);
  console.log(`  Required Skills: ${jd.requiredSkills.join(", ")}`);
  console.log(`  Optional Skills: ${jd.optionalSkills.join(", ")}`);
});

// ── Match ──
const result = matchResumeToJDs(parsedResume, parsedJDs);

console.log("\n========== FINAL MATCH OUTPUT ==========");
console.log(JSON.stringify(result, null, 2));

// ── Save output ──
fs.writeFileSync(
  path.join(__dirname, "output.json"),
  JSON.stringify(result, null, 2)
);
console.log("\n✅ Output saved to sample/output.json");
