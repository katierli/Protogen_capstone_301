<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment, Standard, Student } from '@/types'
import { useRiskFlags } from '@/composables/useRiskFlags'

const props = defineProps<{
  students: Student[]
  assessments: Assessment[]
  standards: Standard[]
}>()

const emit = defineEmits<{ 'select-student': [studentId: string] }>()

const { computeRiskFlags } = useRiskFlags()

const standardCodeById = computed(() => new Map(props.standards.map((s) => [s.id, s.code])))

const riskFlags = computed(() =>
  computeRiskFlags(
    props.students,
    props.assessments,
    props.standards.map((s) => s.id),
  ),
)

function riskChipColor(level: 'high' | 'moderate') {
  return level === 'high' ? 'error' : 'warning'
}

function riskLabel(level: 'high' | 'moderate') {
  return level === 'high' ? '🔴 High Risk' : '🟡 Moderate'
}

function sparklinePoints(trend: { average: number }[]) {
  if (trend.length === 0) return ''
  const width = 100
  const height = 28
  const step = trend.length > 1 ? width / (trend.length - 1) : 0
  return trend
    .map((point, i) => `${i * step},${height - point.average * height}`)
    .join(' ')
}
</script>

<template>
  <v-card class="mb-6" rounded="lg" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">High Risk Students</v-card-title>
    <v-card-subtitle>Struggling on the same standard across 2+ assessments</v-card-subtitle>

    <v-card-text>
      <v-alert v-if="riskFlags.length === 0" type="success" variant="tonal" density="compact">
        No students currently meet the at-risk thresholds for this period.
      </v-alert>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Student</th>
            <th>Period</th>
            <th>At-Risk Standard(s)</th>
            <th># Struggling</th>
            <th>Trend</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="flag in riskFlags"
            :key="flag.student.id"
            class="risk-row"
            @click="emit('select-student', flag.student.id)"
          >
            <td class="font-weight-medium">{{ flag.student.name }}</td>
            <td>{{ flag.student.period }}</td>
            <td>
              <v-chip
                v-for="standardId in flag.atRiskStandardIds"
                :key="standardId"
                size="small"
                class="mr-1"
                variant="outlined"
              >
                {{ standardCodeById.get(standardId) }}
              </v-chip>
            </td>
            <td>{{ flag.struggleCount }}</td>
            <td>
              <svg width="100" height="28" viewBox="0 0 100 28">
                <polyline
                  :points="sparklinePoints(flag.trend)"
                  fill="none"
                  stroke="#1A237E"
                  stroke-width="2"
                />
              </svg>
            </td>
            <td>
              <v-chip :color="riskChipColor(flag.riskLevel)" size="small" variant="flat">
                {{ riskLabel(flag.riskLevel) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.risk-row {
  cursor: pointer;
}

.risk-row:hover {
  background-color: rgba(26, 35, 126, 0.05);
}
</style>
