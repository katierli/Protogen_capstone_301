import type { Assessment, Student } from '@/types'

export interface QuestionStat {
  questionId: string
  standardId: string
  type: 'multiple-choice' | 'open-response'
  value: number // % correct (0-1) for MC, average rubric (1-4) for OR
  normalized: number // 0-1, for shared color coding
}

export interface StandardBreakdown {
  standardId: string
  normalizedAverage: number
  isStrength: boolean
  needsReteach: boolean
}

export function useAssessmentSummary() {
  function getMostRecentAssessment(assessments: Assessment[]): Assessment | null {
    if (assessments.length === 0) return null
    return [...assessments].sort((a, b) => b.date.localeCompare(a.date))[0]!
  }

  function getQuestionStats(assessment: Assessment, students: Student[]): QuestionStat[] {
    return assessment.questions.map((question) => {
      const scores: number[] = []
      for (const student of students) {
        const result = student.assessmentResults.find((r) => r.assessmentId === assessment.id)
        const answer = result?.answers.find((a) => a.questionId === question.questionId)
        if (answer) scores.push(answer.score)
      }
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const normalized = question.type === 'multiple-choice' ? avg : (avg - 1) / 3
      return {
        questionId: question.questionId,
        standardId: question.standardId,
        type: question.type,
        value: avg,
        normalized,
      }
    })
  }

  function getStandardsBreakdown(assessment: Assessment, students: Student[]): StandardBreakdown[] {
    const stats = getQuestionStats(assessment, students)
    return assessment.standardsTested.map((standardId) => {
      const relevant = stats.filter((s) => s.standardId === standardId)
      const normalizedAverage = relevant.length
        ? relevant.reduce((sum, s) => sum + s.normalized, 0) / relevant.length
        : 0
      return {
        standardId,
        normalizedAverage,
        isStrength: normalizedAverage >= 0.75,
        needsReteach: normalizedAverage < 0.6,
      }
    })
  }

  /** A group's average normalized score (0-1) across every question in an assessment. */
  function getAssessmentAverage(assessment: Assessment, students: Student[]): number {
    const stats = getQuestionStats(assessment, students)
    if (stats.length === 0) return 0
    return stats.reduce((sum, s) => sum + s.normalized, 0) / stats.length
  }

  return { getMostRecentAssessment, getQuestionStats, getStandardsBreakdown, getAssessmentAverage }
}
