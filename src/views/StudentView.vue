<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Backend } from '@/main'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { CourseSessionListItem } from '@/backend/AttendMeBackendClientBase'

const sessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function formatDate(date: Date | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    // RÓŻNICA: Pobieramy zajęcia STUDENTA
    const response = await Backend.courseStudentSessionsGet({ pageNumber: 1, pageSize: 100 })
    sessions.value = response.items || []
  } catch (error) {
    console.error("Błąd pobierania zajęć:", error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4 text-white">
      <h1>Panel Studenta</h1>
      <div>
        <span class="me-3">{{ authStore.user?.name }} {{ authStore.user?.surname }}</span>
        <button class="btn btn-danger btn-sm" @click="handleLogout">Wyloguj</button>
      </div>
    </div>

    <div class="card shadow">
      <div class="card-header bg-success text-white">
        Nadchodzące Zajęcia
      </div>
      <div class="card-body">
        
        <div v-if="isLoading" class="text-center p-3">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="sessions.length === 0" class="alert alert-info">
          Brak zajęć do wyświetlenia.
        </div>

        <div v-else class="list-group">
          <div 
            v-for="session in sessions" 
            :key="session.courseSessionId" 
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 class="mb-1">{{ session.courseName }}</h5>
              <small class="text-muted">
                {{ formatDate(session.dateStart) }} | {{ session.locationName || 'Sala nieznana' }}
              </small>
            </div>
            <button class="btn btn-success">
              Rejestruj
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>