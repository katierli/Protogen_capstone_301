<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { Assessment, Standard, Student } from '@/types'
import { useAssessmentSummary } from '@/composables/useAssessmentSummary'
import { getScoreColor } from '@/composables/useStudentPerformance'

const props = defineProps<{
  students: Student[]
  assessments: Assessment[]
  standards: Standard[]
}>()

const { getMostRecentAssessment, getQuestionStats, getStandardsBreakdown } = useAssessmentSummary()

const standardCodeById = computed(() => new Map(props.standards.map((s) => [s.id, s.code])))

const assessment = computed(() => getMostRecentAssessment(props.assessments))

const questionStats = computed(() => (assessment.value ? getQuestionStats(assessment.value, props.students) : []))

const breakdown = computed(() => (assessment.value ? getStandardsBreakdown(assessment.value, props.students) : []))

const strengths = computed(() => breakdown.value.filter((b) => b.isStrength))
const reteachFlags = computed(() => breakdown.value.filter((b) => b.needsReteach))

function statLabel(stat: { type: string; value: number }) {
  return stat.type === 'multiple-choice' ? `${Math.round(stat.value * 100)}%` : stat.value.toFixed(1)
}

const chartData = computed(() => ({
  labels: questionStats.value.map((s, i) => `Q${i + 1} (${standardCodeById.value.get(s.standardId) ?? s.standardId})`),
  datasets: [
    {
      label: 'Performance',
      data: questionStats.value.map((s) => Math.round(s.normalized * 100)),
      backgroundColor: questionStats.value.map((s) => getScoreColor(s.normalized)),
    },
  ],
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { min: 0, max: 100, title: { display: true, text: '% Correct / Rubric Score' } } },
}
</script>

<template>
  <v-card class="mb-6" rounded="lg" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">Most Recent Assessment Snapshot</v-card-title>

    <v-card-text v-if="!assessment">
      <v-alert type="info" variant="tonal">No assessments found for this period yet.</v-alert>
    </v-card-text>

    <v-card-text v-else>
      <div class="d-flex flex-wrap align-center mb-4 ga-2">
        <div>
          <div class="text-h6">{{ assessment.title }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ assessment.type.toUpperCase() }} · {{ assessment.date }}
          </div>
        </div>
      </div>

      <v-row>
        <v-col cols="12" md="7">
          <div style="height: 320px">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </v-col>
        <v-col cols="12" md="5">
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">Strengths</div>
            <v-chip
              v-for="s in strengths"
              :key="s.standardId"
              color="success"
              variant="flat"
              size="small"
              class="mr-1 mb-1"
            >
              {{ standardCodeById.get(s.standardId) }}
            </v-chip>
            <div v-if="strengths.length === 0" class="text-caption text-medium-emphasis">
              No standout standards this assessment.
            </div>
          </div>

          <div>
            <div class="text-subtitle-2 font-weight-bold mb-1">Reteach Flags</div>
            <v-chip
              v-for="r in reteachFlags"
              :key="r.standardId"
              color="error"
              variant="flat"
              size="small"
              class="mr-1 mb-1"
            >
              🔁 Needs Reteach · {{ standardCodeById.get(r.standardId) }}
            </v-chip>
            <div v-if="reteachFlags.length === 0" class="text-caption text-medium-emphasis">
              No reteach flags — class is on track.
            </div>
          </div>
        </v-col>
      </v-row>

      <v-table density="compact" class="mt-4">
        <thead>
          <tr>
            <th>Question</th>
            <th>Standard</th>
            <th>Type</th>
            <th>Class Performance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stat, i) in questionStats" :key="stat.questionId">
            <td>Q{{ i + 1 }}</td>
            <td>{{ standardCodeById.get(stat.standardId) }}</td>
            <td>{{ stat.type === 'multiple-choice' ? 'Multiple Choice' : 'Open Response' }}</td>
            <td>
              <v-chip :style="{ backgroundColor: getScoreColor(stat.normalized), color: 'white' }" size="small">
                {{ statLabel(stat) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
