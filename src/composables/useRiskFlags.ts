import type { Assessment, Student } from '@/types'
import { useStudentPerformance } from './useStudentPerformance'

export interface StandardStruggle {
  standardId: string
  strugglingAssessmentIds: string[]
}

export interface RiskFlag {
  student: Student
  riskLevel: 'high' | 'moderate'
  atRiskStandardIds: string[]
  struggleCount: number
  trend: { date: string; average: number }[]
}

const MC_THRESHOLD = 0.6 // below 60% correct counts as struggling
const OR_THRESHOLD = 2.0 // below 2.0 (of 4) counts as struggling
const OR_THRESHOLD_NORMALIZED = (OR_THRESHOLD - 1) / 3

export function useRiskFlags() {
  const { scoredAnswersForStudent, studentStandardTrend } = useStudentPerformance()

  function struggleForStandard(student: Student, assessments: Assessment[], standardId: string): StandardStruggle {
    const scored = scoredAnswersForStudent(student, assessments).filter((s) => s.standardId === standardId)
    const byAssessment = new Map<string, number[]>()
    for (const s of scored) {
      const list = byAssessment.get(s.assessmentId) ?? []
      list.push(s.normalized)
      byAssessment.set(s.assessmentId, list)
    }

    // Re-derive question types per assessment so MC and open-response are judged against their own threshold.
    const strugglingAssessmentIds: string[] = []
    for (const assessment of assessments) {
      const questionsForStandard = assessment.questions.filter((q) => q.standardId === standardId)
      if (questionsForStandard.length === 0) continue
      const result = student.assessmentResults.find((r) => r.assessmentId === assessment.id)
      if (!result) continue

      const mcScores: number[] = []
      const orScores: number[] = []
      for (const q of questionsForStandard) {
        const answer = result.answers.find((a) => a.questionId === q.questionId)
        if (!answer) continue
        if (q.type === 'multiple-choice') mcScores.push(answer.score)
        else orScores.push((answer.score - 1) / 3)
      }

      const mcPercent = mcScores.length ? mcScores.reduce((a, b) => a + b, 0) / mcScores.length : null
      const orAverage = orScores.length ? orScores.reduce((a, b) => a + b, 0) / orScores.length : null
      const isStruggling = (mcPercent !== null && mcPercent < MC_THRESHOLD) || (orAverage !== null && orAverage < OR_THRESHOLD_NORMALIZED)
      if (isStruggling) strugglingAssessmentIds.push(assessment.id)
    }

    return { standardId, strugglingAssessmentIds }
  }

  function computeRiskFlags(students: Student[], assessments: Assessment[], standardIds: string[]): RiskFlag[] {
    const flags: RiskFlag[] = []
    for (const student of students) {
      const struggles = standardIds
        .map((id) => struggleForStandard(student, assessments, id))
        .filter((s) => s.strugglingAssessmentIds.length >= 2)

      if (struggles.length === 0) continue

      const atRiskStandardIds = struggles.map((s) => s.standardId)
      const struggleCount = new Set(struggles.flatMap((s) => s.strugglingAssessmentIds)).size
      const riskLevel = struggles.length >= 2 ? 'high' : 'moderate'
      const trend = studentStandardTrend(student, assessments, atRiskStandardIds[0]!)

      flags.push({ student, riskLevel, atRiskStandardIds, struggleCount, trend })
    }

    return flags.sort((a, b) => (a.riskLevel === b.riskLevel ? 0 : a.riskLevel === 'high' ? -1 : 1))
  }

  return { computeRiskFlags, struggleForStandard }
}
