<script setup lang="ts">
import { computed } from 'vue'
import type { Period, Student } from '@/types'

const props = defineProps<{
  students: Student[]
  teacherName: string
  schoolYear: string
}>()

const selectedPeriod = defineModel<Period | 'All Periods'>('period', { required: true })
const selectedStudentId = defineModel<string | null>('studentId', { required: true })

const periodOptions: (Period | 'All Periods')[] = ['All Periods', 'Period 1', 'Period 3', 'Period 5']

const studentOptions = computed(() => {
  const inPeriod =
    selectedPeriod.value === 'All Periods'
      ? props.students
      : props.students.filter((s) => s.period === selectedPeriod.value)
  return [
    { title: 'All Students', value: null },
    ...inPeriod
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ title: s.name, value: s.id })),
  ]
})
</script>

<template>
  <v-app-bar color="primary" density="comfortable" elevation="2" class="pr-4">
    <v-app-bar-title class="text-h6 font-weight-bold flex-grow-0">
      <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
      ELA Classroom Dashboard
    </v-app-bar-title>

    <v-spacer />

    <div class="d-none d-sm-flex flex-column align-end mr-4 text-caption text-white opacity-80">
      <span>{{ teacherName }}</span>
      <span>{{ schoolYear }}</span>
    </div>

    <template #extension>
      <div class="d-flex flex-wrap align-center ga-4 px-2 py-2 w-100">
        <v-select
          v-model="selectedPeriod"
          :items="periodOptions"
          label="Class Period"
          variant="solo-filled"
          density="compact"
          hide-details
          style="max-width: 200px; min-width: 160px"
        />

        <v-select
          v-model="selectedStudentId"
          :items="studentOptions"
          item-title="title"
          item-value="value"
          label="Student"
          variant="solo-filled"
          density="compact"
          hide-details
          style="max-width: 240px; min-width: 180px"
        />
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
</style>
