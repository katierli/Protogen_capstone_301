<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Assessment, AssessmentType, Standard, Student } from '@/types'
import { useStudentPerformance, getScoreColor } from '@/composables/useStudentPerformance'
import miniLessons from '@/data/miniLessons.json'

const props = defineProps<{
  student: Student
  assessments: Assessment[]
  standards: Standard[]
}>()

const emit = defineEmits<{ 'back-to-class': [] }>()

const { studentOverallAverage, studentStandardAverage } = useStudentPerformance()

const overallPercent = computed(() => Math.round(studentOverallAverage(props.student, props.assessments) * 100))

const standardAverages = computed(() =>
  props.standards.map((standard) => ({
    standard,
    average: studentStandardAverage(props.student, props.assessments, standard.id),
  })),
)

const strengths = computed(() => standardAverages.value.filter((s) => s.average >= 0.75))
const growthAreas = computed(() => standardAverages.value.filter((s) => s.average > 0 && s.average < 0.6))

const lessonsByStandard = miniLessons as Record<string, string[]>

interface AssessmentRow {
  assessmentId: string
  title: string
  type: AssessmentType
  date: string
  percent: number
}

const assessmentTable = computed<AssessmentRow[]>(() => {
  const rows: AssessmentRow[] = []
  for (const assessment of props.assessments) {
    const result = props.student.assessmentResults.find((r) => r.assessmentId === assessment.id)
    if (!result) continue
    const values = assessment.questions.map((q) => {
      const answer = result.answers.find((a) => a.questionId === q.questionId)
      if (!answer) return null
      return q.type === 'multiple-choice' ? answer.score : (answer.score - 1) / 3
    }).filter((v): v is number => v !== null)
    const percent = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) : 0
    rows.push({ assessmentId: assessment.id, title: assessment.title, type: assessment.type, date: assessment.date, percent })
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date))
})

const typeFilter = ref<AssessmentType | 'all'>('all')
const typeFilterOptions = [
  { title: 'All Types', value: 'all' },
  { title: 'Quiz', value: 'quiz' },
  { title: 'Test', value: 'test' },
  { title: 'Essay', value: 'essay' },
  { title: 'Project', value: 'project' },
]

const filteredAssessmentTable = computed(() =>
  typeFilter.value === 'all' ? assessmentTable.value : assessmentTable.value.filter((r) => r.type === typeFilter.value),
)
</script>

<template>
  <v-card rounded="lg" elevation="2" class="mb-6">
    <v-card-title class="d-flex align-center justify-space-between">
      <div>
        <span class="text-h6 font-weight-bold">{{ student.name }}</span>
        <span class="text-caption text-medium-emphasis ml-2">{{ student.period }} · Overall: {{ overallPercent }}%</span>
      </div>
      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="emit('back-to-class')">Back to Class View</v-btn>
    </v-card-title>

    <v-card-text>
      <div class="text-subtitle-2 font-weight-bold mb-2">Cumulative Performance by Standard</div>
      <v-table density="compact" class="mb-6">
        <thead>
          <tr>
            <th>Standard</th>
            <th>Description</th>
            <th>Cumulative Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in standardAverages" :key="s.standard.id">
            <td class="font-weight-medium">{{ s.standard.code }}</td>
            <td>{{ s.standard.description }}</td>
            <td>
              <v-chip :style="{ backgroundColor: getScoreColor(s.average), color: 'white' }" size="small">
                {{ Math.round(s.average * 100) }}%
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 font-weight-bold mb-1">Strengths</div>
          <v-chip v-for="s in strengths" :key="s.standard.id" color="success" variant="flat" size="small" class="mr-1 mb-1">
            {{ s.standard.code }} · {{ Math.round(s.average * 100) }}%
          </v-chip>
          <div v-if="strengths.length === 0" class="text-caption text-medium-emphasis">
            Building toward consistent strengths.
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 font-weight-bold mb-1">Growth Areas</div>
          <v-chip v-for="g in growthAreas" :key="g.standard.id" color="error" variant="flat" size="small" class="mr-1 mb-1">
            {{ g.standard.code }} · {{ Math.round(g.average * 100) }}%
          </v-chip>
          <div v-if="growthAreas.length === 0" class="text-caption text-medium-emphasis">
            No persistent growth areas — nice work!
          </div>
        </v-col>
      </v-row>

      <div v-if="growthAreas.length > 0" class="mt-6">
        <div class="text-subtitle-2 font-weight-bold mb-2">Reteach Recommendations</div>
        <v-card v-for="g in growthAreas" :key="g.standard.id" variant="tonal" class="mb-2" rounded="lg">
          <v-card-text>
            <div class="font-weight-bold">{{ g.standard.code }} — {{ g.standard.description }}</div>
            <div class="text-caption text-medium-emphasis mb-2">Average score: {{ Math.round(g.average * 100) }}%</div>
            <ul class="mini-lesson-list">
              <li v-for="lesson in lessonsByStandard[g.standard.id] ?? []" :key="lesson">{{ lesson }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </div>

      <div class="mt-6">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-2 font-weight-bold">All Assessment Scores</div>
          <v-select
            v-model="typeFilter"
            :items="typeFilterOptions"
            item-title="title"
            item-value="value"
            density="compact"
            hide-details
            style="max-width: 180px"
          />
        </div>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Type</th>
              <th>Date</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredAssessmentTable" :key="row.assessmentId">
              <td>{{ row.title }}</td>
              <td class="text-capitalize">{{ row.type }}</td>
              <td>{{ row.date }}</td>
              <td>{{ row.percent }}%</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.mini-lesson-list {
  margin: 0;
  padding-left: 1.25rem;
}
</style>
