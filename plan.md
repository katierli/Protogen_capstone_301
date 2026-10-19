# ELA Classroom Dashboard - Project Brief

## What is this?
A multi-view educator dashboard for an English Language Arts classroom that gives teachers real-time insight into student performance across all assessments, tied to ELA standards. Think of it as a teacher's command center — replacing manual spreadsheets with an at-a-glance view of who's thriving, who's struggling, and exactly what needs to be retaught and when.

---

## Data
Generate a fake dataset as a JSON file (`src/data/classroomData.json`).

The dataset should include:

### Students
- 25–30 fake students across **3 class periods** (Period 1, Period 3, Period 5)
- Each student has:
  - `id`, `name`, `period`
  - An array of `assessmentResults` (see below)

### ELA Standards (for the year)
A separate `standards.json` file listing ~10–12 ELA standards, for example:
- `RL.8.1` – Cite textual evidence
- `RL.8.2` – Determine theme
- `W.8.1` – Write arguments
- `L.8.2` – Command of conventions
- etc.

Each standard has: `id`, `code`, `description`, `unit`

### Assessments
~15–20 assessments spread across the year (Sept–June), each containing:
- `id`, `title`, `type` (`quiz`, `test`, `essay`, `project`)
- `date`
- `standardsTested` (array of standard IDs)
- An array of `questions`, each with:
  - `questionId`, `standardId`, `type` (`multiple-choice` or `open-response`)
  - For **multiple choice**: scored as `correct` (1) or `incorrect` (0)
  - For **open response**: scored on a rubric scale of `1–4`
    - `4` = Exceeds Expectations
    - `3` = Meets Expectations
    - `2` = Approaching
    - `1` = Developing

Each student's result per assessment maps their answers/scores to each question.

---

## Layout (Vuetify)

### App Bar
- Dashboard title: **"ELA Classroom Dashboard"**
- **Class Period dropdown** (All Periods / Period 1 / Period 3 / Period 5) — filters the entire dashboard
- **Student dropdown** (defaults to "All Students" — selecting one triggers the Student Zoom-In view)
- Teacher name + school year displayed subtly on the right

---

### Window 1 — Overall Performance for the Year
A full-width section at the top showing:
- A **standards performance heatmap or grid** — rows = students (or aggregated by class), columns = ELA standards
  - Color coded:
    - Multiple choice: **green** (correct) / **red** (incorrect)
    - Open response: gradient scale — deep red (1) → orange (2) → yellow (3) → green (4)
- Summary stat cards above the grid:
  - Class average score
  - % of standards "on track" vs. "at risk"
  - Total assessments completed
  - Most recent assessment date

---

### Window 2 — High Risk Students
A panel showing students who are **struggling across multiple assessments**:
- Triggered when a student has scored below a threshold (e.g., avg < 2.0 on open response OR < 60% correct on multiple choice) **on 2 or more assessments for the same standard**
- Displays as a list/table:
  - Student name
  - Period
  - At-risk standard(s)
  - Number of assessments showing struggle
  - A small inline spark-line or bar showing their trend
- Color-coded risk level: 🔴 High Risk / 🟡 Moderate / 🟢 On Track

---

### Window 3 — Most Recent Assessment Snapshot
A section that auto-loads the **most recent assessment** taken by the class:
- Assessment title, type, and date
- Class-wide performance breakdown:
  - Per question: % correct (MC) or average rubric score (OR)
  - Color indicators per question (green/yellow/red)
- **Strengths section**: Standards where the class performed well
- **Reteach Flags**: Standards where class average was low — highlighted with a "🔁 Needs Reteach" badge
- A bar or horizontal chart showing question-by-question performance

---

### Window 4 — Student Zoom-In View
Activated when a **specific student is selected** from the dropdown in the app bar:

- Student name, period, and overall performance summary
- **Standards Performance Timeline**: a line or bar chart showing their score trend across assessments for each standard
- **Strengths**: Standards/skills where they consistently score well
- **Growth Areas**: Standards where they are consistently low
- **Reteach Recommendations**: Per struggling standard, show:
  - The standard code + description
  - Their average score on it
  - 2–3 suggested **mini-lessons** (fake but realistic, e.g., *"Mini-Lesson: Using context clues to identify theme — RL.8.2"*)
- A full table of all their assessment scores (filterable by assessment type)

---

## Interactions
- **Period dropdown** in the app bar filters Windows 1, 2, and 3 to that class period
- **Student dropdown** activates Window 4 (Zoom-In); all other windows dim or collapse
- **"Back to Class View"** button returns to the full dashboard
- Cards and risk flags update dynamically based on the selected period
- Hovering over a cell in the standards grid shows a tooltip: student name, standard, score, and assessment name
- High-risk student rows are **clickable** — clicking one auto-selects that student in the dropdown and opens Window 4

---

## Style
- **Light theme** with clean, classroom-friendly design — think Google Classroom meets a modern analytics tool
- Primary color: deep blue (`#1A237E`) with teal accents (`#00897B`)
- Score colors:
  - ✅ Green: correct / exceeds (`#43A047`)
  - 🟡 Yellow: approaching (`#FDD835`)
  - 🟠 Orange: developing-ish (`#FB8C00`)
  - 🔴 Red: incorrect / developing (`#E53935`)
- Cards with subtle shadows and rounded corners
- Clean sans-serif font (Roboto via Vuetify default)
- Mobile responsive — cards and windows stack on small screens
- Lots of whitespace — this is a tool teachers use in the morning, not a data warehouse

---

## Tech
- **Vue 3 + TypeScript + Vuetify 3**
- **Chart.js via vue-chartjs** for all charts (bar, line, heatmap-style)
- Fake data from local JSON files — **no API calls**
- **Single page — no routing needed**
- All filtering and aggregation logic handled in Vue composables (`src/composables/`)
- Data files live in `src/data/`

---

## File Structure (suggested)
src/
├── data/
│   ├── classroomData.json
│   └── standards.json
├── composables/
│   ├── useStudentPerformance.ts
│   ├── useRiskFlags.ts
│   └── useAssessmentSummary.ts
├── components/
│   ├── AppBar.vue
│   ├── OverallPerformanceWindow.vue
│   ├── HighRiskStudentsWindow.vue
│   ├── RecentAssessmentWindow.vue
│   └── StudentZoomInWindow.vue
└── App.vue