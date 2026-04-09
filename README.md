# Resume Parsing & Job Matching System

A rule-based system to parse resumes, extract structured data from Job Descriptions (JDs), and compute skill-based matching scores — **without using any LLMs or AI APIs**.

---

## Features

- **Resume Parsing** — Extracts name, email, phone, skills, and years of experience from PDF or plain text resumes
- **JD Parsing** — Extracts salary, required experience, required skills, optional skills, and role summary
- **Skill Matching** — Compares resume skills against each JD and flags each skill as present/absent
- **Matching Score** — `(Matched Skills / Total JD Skills) × 100`
- **REST API** — Express-based API with 3 endpoints
- **No LLMs** — Pure regex, rule-based NLP, and keyword matching

---

## Tech Stack

- **Node.js** + **Express**
- **pdf-parse** — PDF text extraction
- **multer** — File upload handling
- **Regex** — Salary, experience, name extraction
- **Keyword matching** — Skill detection from a curated skills dictionary

---

## Setup

### Prerequisites
- Node.js v16+
- npm

### Install

```bash
git clone <your-repo-url>
cd resume-matcher
npm install
```

### Run

```bash
# Start the API server
npm start

# Development mode (auto-reload)
npm run dev

# Run the test script
npm test
```

Server runs at: `http://localhost:3000`

---

## API Endpoints

### `GET /`
Health check — returns available endpoints.

---

### `POST /api/parse/resume`
Parse a resume and extract structured data.

**Option A — File upload (PDF or TXT):**
```bash
curl -X POST http://localhost:3000/api/parse/resume \
  -F "resume=@/path/to/resume.pdf"
```

**Option B — Plain text:**
```bash
curl -X POST http://localhost:3000/api/parse/resume \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe\njohn@email.com\n5 years experience in Java, Python, Docker..."}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-123-4567",
    "yearOfExperience": 5,
    "resumeSkills": ["java", "python", "docker", "react"]
  }
}
```

---

### `POST /api/parse/jd`
Parse a single Job Description.

```bash
curl -X POST http://localhost:3000/api/parse/jd \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "JD001",
    "role": "Backend Developer",
    "text": "7 years experience with Java, Spring Boot, Kafka, Docker, Kubernetes. Salary: $120,000 - $150,000"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "JD001",
    "role": "Backend Developer",
    "salary": "$120,000 - $150,000",
    "requiredExperience": 7,
    "requiredSkills": ["java", "spring boot", "kafka", "docker", "kubernetes"],
    "optionalSkills": [],
    "allSkills": ["java", "spring boot", "kafka", "docker", "kubernetes"]
  }
}
```

---

### `POST /api/match`
Match a resume against multiple JDs and get scores.

```bash
curl -X POST http://localhost:3000/api/match \
  -F "resume=@/path/to/resume.pdf" \
  -F 'jds=[{"jobId":"JD001","role":"Backend Dev","text":"Java Spring Boot Docker Kafka. Salary $120k-$150k"}]'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "yearOfExperience": 5,
    "resumeSkills": ["java", "spring boot", "docker", "kafka", "react"],
    "matchingJobs": [
      {
        "jobId": "JD001",
        "role": "Backend Developer",
        "salary": "$120,000 - $150,000",
        "aboutRole": "...",
        "skillsAnalysis": [
          { "skill": "java", "presentInResume": true },
          { "skill": "spring boot", "presentInResume": true },
          { "skill": "kafka", "presentInResume": true },
          { "skill": "docker", "presentInResume": true },
          { "skill": "kubernetes", "presentInResume": false }
        ],
        "matchingScore": 80
      }
    ]
  }
}
```

---

## Project Structure

```
resume-matcher/
├── src/
│   ├── parsers/
│   │   ├── resumeParser.js    # Resume text/PDF parser
│   │   └── jdParser.js        # JD parser (salary, skills, experience)
│   ├── matchers/
│   │   └── skillMatcher.js    # Skill comparison + score calculation
│   ├── utils/
│   │   └── textUtils.js       # Regex helpers
│   └── data/
│       └── skillsList.js      # Master skills dictionary (~100 skills)
├── routes/
│   └── api.js                 # Express route handlers
├── sample/
│   ├── resume.txt             # Sample resume for testing
│   ├── test.js                # End-to-end test script
│   └── output.json            # Generated sample output
├── app.js                     # Express server entry
├── package.json
└── README.md
```

---

## Matching Formula

```
Matching Score = (Matched JD Skills / Total JD Skills) × 100
```

- Results sorted by score descending
- Required and optional skills are both included in the total
- Skill comparison is case-insensitive and normalizes punctuation

---

## Extending the Skill Dictionary

Edit `src/data/skillsList.js` to add more skills. Longer phrases (e.g. `"spring boot"`) are matched before shorter ones (e.g. `"spring"`) to avoid false positives.

---

## Sample Output

See `sample/output.json` for a full example matching one resume against 3 JDs.
