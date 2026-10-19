import type { Assessment, AssessmentResult, Question, Student } from '@/types'

/** Normalizes any question score to a 0-1 scale (MC is already 0/1, OR is 1-4). */
export function normalizeScore(question: Question, score: number): number {
  if (question.type === 'multiple-choice') return score
  return (score - 1) / 3
}

export function getScoreColor(normalized: number): string {
  if (normalized >= 0.8) return '#43A047'
  if (normalized >= 0.6) return '#FDD835'
  if (normalized >= 0.4) return '#FB8C00'
  return '#E53935'
}

interface ScoredAnswer {
  assessmentId: string
  assessmentDate: string
  standardId: string
  normalized: number
}

/** Flattens a student's raw answers into normalized scores, joined with question/assessment metadata. */
export function useStudentPerformance() {
  function buildQuestionIndex(assessments: Assessment[]) {
    const index = new Map<string, { question: Question; assessment: Assessment }>()
    for (const assessment of assessments) {
      for (const question of assessment.questions) {
        index.set(question.questionId, { question, assessment })
      }
    }
    return index
  }

  function scoredAnswersForStudent(student: Student, assessments: Assessment[]): ScoredAnswer[] {
    const index = buildQuestionIndex(assessments)
    const scored: ScoredAnswer[] = []
    for (const result of student.assessmentResults) {
      for (const answer of result.answers) {
        const entry = index.get(answer.questionId)
        if (!entry) continue
        scored.push({
          assessmentId: entry.assessment.id,
          assessmentDate: entry.assessment.date,
          standardId: entry.question.standardId,
          normalized: normalizeScore(entry.question, answer.score),
        })
      }
    }
    return scored
  }

  function average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  function studentOverallAverage(student: Student, assessments: Assessment[]): number {
    return average(scoredAnswersForStudent(student, assessments).map((s) => s.normalized))
  }

  function studentStandardAverage(student: Student, assessments: Assessment[], standardId: string): number {
    const scores = scoredAnswersForStudent(student, assessments)
      .filter((s) => s.standardId === standardId)
      .map((s) => s.normalized)
    return average(scores)
  }

  /** Per-assessment average normalized score for a student on a given standard, ordered by date. */
  function studentStandardTrend(student: Student, assessments: Assessment[], standardId: string) {
    const scored = scoredAnswersForStudent(student, assessments).filter((s) => s.standardId === standardId)
    const byAssessment = new Map<string, { date: string; values: number[] }>()
    for (const s of scored) {
      const entry = byAssessment.get(s.assessmentId) ?? { date: s.assessmentDate, values: [] }
      entry.values.push(s.normalized)
      byAssessment.set(s.assessmentId, entry)
    }
    return [...byAssessment.values()]
      .map((entry) => ({ date: entry.date, average: average(entry.values) }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  function classAverage(students: Student[], assessments: Assessment[]): number {
    return average(students.map((s) => studentOverallAverage(s, assessments)))
  }

  /** Average of a group of students' per-student standard averages (e.g. a class or a period). */
  function aggregateStandardAverage(students: Student[], assessments: Assessment[], standardId: string): number {
    return average(students.map((s) => studentStandardAverage(s, assessments, standardId)))
  }

  return {
    scoredAnswersForStudent,
    studentOverallAverage,
    studentStandardAverage,
    aggregateStandardAverage,
    studentStandardTrend,
    classAverage,
    average,
  }
}

export type { ScoredAnswer, AssessmentResult }
