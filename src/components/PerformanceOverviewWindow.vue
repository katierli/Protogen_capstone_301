<script setup lang="ts">
import { computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import type { Assessment, Period, Standard, Student } from '@/types'
import { useStudentPerformance, getScoreColor } from '@/composables/useStudentPerformance'
import { useAssessmentSummary } from '@/composables/useAssessmentSummary'
import miniLessons from '@/data/miniLessons.json'

const props = defineProps<{
  students: Student[]
  assessments: Assessment[]
  standards: Standard[]
  period: Period | 'All Periods'
}>()

const lessonsByStandard = miniLessons as Record<string, string[]>

const { classAverage, aggregateStandardAverage, studentStandardAverage } = useStudentPerformance()
const { getAssessmentAverage, getMostRecentAssessment, getQuestionStats } = useAssessmentSummary()

const periods: Period[] = ['Period 1', 'Period 3', 'Period 5']
const periodColors: Record<Period, string> = {
  'Period 1': '#1A237E',
  'Period 3': '#00897B',
  'Period 5': '#FB8C00',
}

const isAllPeriods = computed(() => props.period === 'All Periods')

const scopeStudents = computed(() =>
  isAllPeriods.value ? props.students : props.students.filter((s) => s.period === props.period),
)

const sortedAssessments = computed(() => [...props.assessments].sort((a, b) => a.date.localeCompare(b.date)))

// --- Stat cards ---
const classAveragePercent = computed(() => Math.round(classAverage(scopeStudents.value, props.assessments) * 100))

const standardsOnTrackPercent = computed(() => {
  if (props.standards.length === 0) return 0
  const onTrackCount = props.standards.filter(
    (standard) => aggregateStandardAverage(scopeStudents.value, props.assessments, standard.id) >= 0.6,
  ).length
  return Math.round((onTrackCount / props.standards.length) * 100)
})

const totalAssessments = computed(() => props.assessments.length)

const mostRecentDate = computed(() => getMostRecentAssessment(props.assessments)?.date ?? '—')

const statCards = computed(() => [
  { label: 'Class Average', value: `${classAveragePercent.value}%`, dot: '#1A237E' },
  { label: 'Standards On Track', value: `${standardsOnTrackPercent.value}%`, dot: '#00897B' },
  { label: 'Assessments Completed', value: `${totalAssessments.value}`, dot: '#FB8C00' },
  { label: 'Most Recent Assessment', value: mostRecentDate.value, dot: '#43A047' },
])

// --- Average Score by Standard chart (both modes) ---
const standardsChartData = computed(() => {
  const averages = props.standards.map((s) => aggregateStandardAverage(scopeStudents.value, props.assessments, s.id))
  return {
    labels: props.standards.map((s) => s.code),
    datasets: [
      {
        label: 'Average Score',
        data: averages.map((a) => Math.round(a * 100)),
        backgroundColor: averages.map((a) => getScoreColor(a)),
      },
    ],
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { min: 0, max: 100, title: { display: true, text: '% Score' } } },
}

// --- Performance trend chart: one line per period (All Periods) or one line for the scope ---
const trendChartData = computed(() => {
  const labels = sortedAssessments.value.map((a) => a.title)

  if (isAllPeriods.value) {
    return {
      labels,
      datasets: periods.map((p) => {
        const periodStudents = props.students.filter((s) => s.period === p)
        return {
          label: p,
          data: sortedAssessments.value.map((a) => Math.round(getAssessmentAverage(a, periodStudents) * 100)),
          borderColor: periodColors[p],
          backgroundColor: periodColors[p],
          tension: 0.3,
        }
      }),
    }
  }

  return {
    labels,
    datasets: [
      {
        label: props.period,
        data: sortedAssessments.value.map((a) => Math.round(getAssessmentAverage(a, scopeStudents.value) * 100)),
        borderColor: '#1A237E',
        backgroundColor: '#1A237E',
        tension: 0.3,
      },
    ],
  }
})

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: isAllPeriods.value } },
  scales: {
    y: { min: 0, max: 100, title: { display: true, text: '% Score' } },
    x: { ticks: { display: false } },
  },
}

// --- Period comparison chart (All Periods only) ---
const periodComparisonData = computed(() => {
  const averages = periods.map((p) => classAverage(props.students.filter((s) => s.period === p), props.assessments))
  return {
    labels: periods,
    datasets: [
      {
        label: 'Average Score',
        data: averages.map((a) => Math.round(a * 100)),
        backgroundColor: periods.map((p) => periodColors[p]),
      },
    ],
  }
})

// --- Needs Reteach / Strengths callouts ---
interface StandardCallout {
  standard: Standard
  averagePercent: number
  breakdown: { label: string; count: number }[]
  miniLesson?: string
}

function buildBreakdown(standardId: string): { label: string; count: number }[] {
  if (isAllPeriods.value) {
    return periods
      .map((p) => {
        const periodStudents = props.students.filter((s) => s.period === p)
        const count = periodStudents.filter(
          (s) => studentStandardAverage(s, props.assessments, standardId) < 0.6,
        ).length
        return { label: p, count }
      })
      .filter((entry) => entry.count > 0)
  }
  const count = scopeStudents.value.filter(
    (s) => studentStandardAverage(s, props.assessments, standardId) < 0.6,
  ).length
  return count > 0 ? [{ label: 'students', count }] : []
}

const reteachStandards = computed<StandardCallout[]>(() =>
  props.standards
    .map((standard) => ({
      standard,
      averagePercent: Math.round(aggregateStandardAverage(scopeStudents.value, props.assessments, standard.id) * 100),
      breakdown: buildBreakdown(standard.id),
      miniLesson: lessonsByStandard[standard.id]?.[0],
    }))
    .filter((s) => s.averagePercent < 60)
    .sort((a, b) => a.averagePercent - b.averagePercent),
)

// --- Suggested Actions: concrete, assessment-grounded follow-ups ---
interface SuggestedAction {
  standard: Standard
  questionNumbers: number[]
  strugglePercent: number
  miniLesson: string
}

const recentAssessment = computed(() => getMostRecentAssessment(props.assessments))

const scopeLabel = computed(() => (isAllPeriods.value ? 'the class' : props.period))

function formatQuestionLabel(questionNumbers: number[]): string {
  const labels = questionNumbers.map((n) => `#${n}`)
  if (labels.length === 1) return `question ${labels[0]}`
  if (labels.length === 2) return `questions ${labels[0]} and ${labels[1]}`
  return `questions ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

const suggestedActions = computed<SuggestedAction[]>(() => {
  const assessment = recentAssessment.value
  if (!assessment) return []

  const stats = getQuestionStats(assessment, scopeStudents.value)
  const byStandard = new Map<string, { questionNumbers: number[]; strugglePercents: number[] }>()
  stats.forEach((stat, index) => {
    if (stat.normalized >= 0.6) return
    const entry = byStandard.get(stat.standardId) ?? { questionNumbers: [], strugglePercents: [] }
    entry.questionNumbers.push(index + 1)
    entry.strugglePercents.push(Math.round((1 - stat.normalized) * 100))
    byStandard.set(stat.standardId, entry)
  })

  const actions: SuggestedAction[] = []
  for (const [standardId, entry] of byStandard) {
    const standard = props.standards.find((s) => s.id === standardId)
    if (!standard) continue
    const strugglePercent = Math.round(
      entry.strugglePercents.reduce((a, b) => a + b, 0) / entry.strugglePercents.length,
    )
    actions.push({
      standard,
      questionNumbers: entry.questionNumbers,
      strugglePercent,
      miniLesson: lessonsByStandard[standardId]?.[0] ?? 'Review the core skill with guided, whole-class practice.',
    })
  }
  return actions.sort((a, b) => b.strugglePercent - a.strugglePercent)
})

const strengthStandards = computed<StandardCallout[]>(() =>
  props.standards
    .map((standard) => ({
      standard,
      averagePercent: Math.round(aggregateStandardAverage(scopeStudents.value, props.assessments, standard.id) * 100),
      breakdown: [],
    }))
    .filter((s) => s.averagePercent >= 75)
    .sort((a, b) => b.averagePercent - a.averagePercent),
)
</script>

<template>
  <v-card class="mb-8" rounded="lg" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">Overall Performance for the Year</v-card-title>
    <v-card-subtitle>{{ isAllPeriods ? 'All Periods · comparing classes' : period }}</v-card-subtitle>

    <v-card-text>
      <v-row class="section-row">
        <v-col v-for="card in statCards" :key="card.label" cols="12" sm="6" md="3">
          <v-card variant="elevated" elevation="1" rounded="lg" class="stat-card">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
                <span class="stat-dot" :style="{ backgroundColor: card.dot }" />
              </div>
              <div class="text-h5 font-weight-bold text-high-emphasis mt-1">{{ card.value }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="section-row">
        <v-col cols="12" md="6">
          <v-card variant="elevated" elevation="1" rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold">Average Score by Standard</v-card-title>
            <v-card-text style="height: 280px">
              <Bar :data="standardsChartData" :options="barChartOptions" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card variant="elevated" elevation="1" rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold">Performance Trend</v-card-title>
            <v-card-text style="height: 280px">
              <Line :data="trendChartData" :options="trendChartOptions" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="isAllPeriods" class="section-row">
        <v-col cols="12">
          <v-card variant="elevated" elevation="1" rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold">Average Score by Class Period</v-card-title>
            <v-card-text style="height: 240px">
              <Bar :data="periodComparisonData" :options="barChartOptions" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="section-row">
        <v-col cols="12">
          <div class="text-subtitle-2 font-weight-bold mb-2">📋 Suggested Actions</div>
          <v-alert v-if="suggestedActions.length === 0" type="success" variant="tonal" density="compact">
            No urgent follow-ups from the most recent assessment{{ recentAssessment ? ` (${recentAssessment.title})` : '' }}.
          </v-alert>
          <div v-else class="d-flex flex-column ga-3">
            <v-card v-for="item in suggestedActions" :key="item.standard.id" variant="tonal" color="warning" rounded="lg">
              <v-card-text>
                <div class="font-weight-medium">
                  {{ item.strugglePercent }}% of {{ scopeLabel }} missed {{ formatQuestionLabel(item.questionNumbers) }}
                  ({{ item.standard.code }}) on "{{ recentAssessment?.title }}".
                </div>
                <div class="text-caption mt-1">Reteach whole-class: {{ item.miniLesson }}</div>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 font-weight-bold mb-2">🔁 Needs Reteach</div>
          <v-alert v-if="reteachStandards.length === 0" type="success" variant="tonal" density="compact">
            No standards currently need reteaching.
          </v-alert>
          <div v-else class="d-flex flex-column ga-3">
            <v-card
              v-for="item in reteachStandards"
              :key="item.standard.id"
              variant="tonal"
              color="error"
              rounded="lg"
            >
              <v-card-text>
                <div class="font-weight-bold">{{ item.standard.code }} — {{ item.standard.description }}</div>
                <div class="text-caption mb-1">Class average: {{ item.averagePercent }}%</div>
                <div v-if="item.breakdown.length" class="text-caption mb-1">
                  <span v-for="(b, i) in item.breakdown" :key="b.label">
                    {{ b.label }}: {{ b.count }} student{{ b.count === 1 ? '' : 's' }}<span v-if="i < item.breakdown.length - 1">&nbsp;·&nbsp;</span>
                  </span>
                </div>
                <div v-if="item.miniLesson" class="text-caption font-weight-medium">
                  Suggested: {{ item.miniLesson }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="text-subtitle-2 font-weight-bold mb-2">Strengths</div>
          <v-alert v-if="strengthStandards.length === 0" type="info" variant="tonal" density="compact">
            No standout standards yet.
          </v-alert>
          <div v-else class="d-flex flex-column ga-3">
            <v-card
              v-for="item in strengthStandards"
              :key="item.standard.id"
              variant="tonal"
              color="success"
              rounded="lg"
            >
              <v-card-text>
                <div class="font-weight-bold">{{ item.standard.code }} — {{ item.standard.description }}</div>
                <div class="text-caption">Class average: {{ item.averagePercent }}%</div>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.section-row {
  margin-bottom: 32px;
}
</style>
