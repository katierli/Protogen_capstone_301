export type Period = 'Period 1' | 'Period 3' | 'Period 5'
export type AssessmentType = 'quiz' | 'test' | 'essay' | 'project'
export type QuestionType = 'multiple-choice' | 'open-response'
export type RiskLevel = 'high' | 'moderate' | 'on-track'

export interface Standard {
  id: string
  code: string
  description: string
  unit: string
}

export interface Question {
  questionId: string
  standardId: string
  type: QuestionType
}

export interface Assessment {
  id: string
  title: string
  type: AssessmentType
  date: string
  standardsTested: string[]
  questions: Question[]
}

export interface AnswerScore {
  questionId: string
  score: number
}

export interface AssessmentResult {
  assessmentId: string
  answers: AnswerScore[]
}

export interface Student {
  id: string
  name: string
  period: Period
  assessmentResults: AssessmentResult[]
}

export interface ClassroomData {
  assessments: Assessment[]
  students: Student[]
}
