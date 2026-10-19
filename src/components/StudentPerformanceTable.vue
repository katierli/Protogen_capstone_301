<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment, Standard, Student } from '@/types'
import { useStudentPerformance, getScoreColor } from '@/composables/useStudentPerformance'

const props = defineProps<{
  students: Student[]
  assessments: Assessment[]
  standards: Standard[]
  periodLabel: string
}>()

const { studentStandardAverage } = useStudentPerformance()

const sortedStudents = computed(() => [...props.students].sort((a, b) => a.name.localeCompare(b.name)))

function cellValue(student: Student, standardId: string) {
  return studentStandardAverage(student, props.assessments, standardId)
}

function cellLabel(normalized: number) {
  return `${Math.round(normalized * 100)}%`
}
</script>

<template>
  <v-card class="mb-8" rounded="lg" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">Student Performance — {{ periodLabel }}</v-card-title>
    <v-card-subtitle>Standards mastery by student</v-card-subtitle>

    <v-card-text>
      <div class="heatmap-scroll">
        <table class="heatmap">
          <thead>
            <tr>
              <th class="sticky-col">Student</th>
              <th v-for="standard in standards" :key="standard.id">{{ standard.code }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in sortedStudents" :key="student.id">
              <td class="sticky-col">{{ student.name }}</td>
              <td v-for="standard in standards" :key="standard.id">
                <v-tooltip location="top">
                  <template #activator="{ props: tooltipProps }">
                    <div
                      v-bind="tooltipProps"
                      class="heatmap-cell"
                      :style="{ backgroundColor: getScoreColor(cellValue(student, standard.id)) }"
                    >
                      {{ cellLabel(cellValue(student, standard.id)) }}
                    </div>
                  </template>
                  <span>{{ student.name }} · {{ standard.code }}: {{ cellLabel(cellValue(student, standard.id)) }}</span>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.heatmap-scroll {
  overflow-x: auto;
  max-height: 480px;
  overflow-y: auto;
}

.heatmap {
  border-collapse: collapse;
  width: 100%;
}

.heatmap th,
.heatmap td {
  padding: 4px 6px;
  text-align: center;
  white-space: nowrap;
  font-size: 0.75rem;
}

.heatmap th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
  font-weight: 600;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  text-align: left;
  z-index: 2;
  font-weight: 500;
}

.heatmap-cell {
  color: white;
  border-radius: 6px;
  padding: 4px 6px;
  min-width: 48px;
  font-weight: 600;
}
</style>
