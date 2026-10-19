<script setup lang="ts">
import { computed, ref } from 'vue'
import classroomData from '@/data/classroomData.json'
import standardsData from '@/data/standards.json'
import type { Assessment, Period, Standard, Student } from '@/types'
import AppBar from '@/components/AppBar.vue'
import PerformanceOverviewWindow from '@/components/PerformanceOverviewWindow.vue'
import StudentPerformanceTable from '@/components/StudentPerformanceTable.vue'
import HighRiskStudentsWindow from '@/components/HighRiskStudentsWindow.vue'
import RecentAssessmentWindow from '@/components/RecentAssessmentWindow.vue'
import StudentZoomInWindow from '@/components/StudentZoomInWindow.vue'

const students = classroomData.students as Student[]
const assessments = classroomData.assessments as Assessment[]
const standards = standardsData as Standard[]

const selectedPeriod = ref<Period | 'All Periods'>('All Periods')
const selectedStudentId = ref<string | null>(null)

const periodFilteredStudents = computed(() =>
  selectedPeriod.value === 'All Periods' ? students : students.filter((s) => s.period === selectedPeriod.value),
)

const selectedStudent = computed(() => students.find((s) => s.id === selectedStudentId.value) ?? null)

function handleSelectStudent(studentId: string) {
  selectedStudentId.value = studentId
}

function handleBackToClass() {
  selectedStudentId.value = null
}
</script>

<template>
  <v-app>
    <AppBar
      v-model:period="selectedPeriod"
      v-model:student-id="selectedStudentId"
      :students="students"
      teacher-name="Ms. Alvarez"
      school-year="2025–2026"
    />

    <v-main>
      <v-container fluid class="py-6 px-4 px-md-8">
        <StudentZoomInWindow
          v-if="selectedStudent"
          :student="selectedStudent"
          :assessments="assessments"
          :standards="standards"
          @back-to-class="handleBackToClass"
        />

        <template v-else>
          <PerformanceOverviewWindow
            :students="students"
            :assessments="assessments"
            :standards="standards"
            :period="selectedPeriod"
          />

          <template v-if="selectedPeriod !== 'All Periods'">
            <StudentPerformanceTable
              :students="periodFilteredStudents"
              :assessments="assessments"
              :standards="standards"
              :period-label="selectedPeriod"
            />
            <HighRiskStudentsWindow
              :students="periodFilteredStudents"
              :assessments="assessments"
              :standards="standards"
              @select-student="handleSelectStudent"
            />
          </template>

          <RecentAssessmentWindow
            :students="periodFilteredStudents"
            :assessments="assessments"
            :standards="standards"
          />
        </template>
      </v-container>
    </v-main>
  </v-app>
</template>

