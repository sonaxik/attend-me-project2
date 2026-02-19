<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Backend } from '@/main'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { CourseSessionListItem } from '@/backend/AttendMeBackendClientBase'
import { formatDateTime } from '@/helpers/dateUtils'
import { filterTeacherSessions, type TeacherFilterType } from '@/helpers/sessionFilterUtils'

const sessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const filterStatus = ref<TeacherFilterType>('all_date')
const searchTerm = ref('')

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function fetchSessions() {
  isLoading.value = true
  try {
    const response = await Backend.courseTeacherSessionsGet({ pageNumber: 1, pageSize: 999999 })
    sessions.value = response.items || []
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function goToSessionCheck(sessionId: number | undefined) {
  if (sessionId) {
    router.push({
      name: 'teacher-session-details',
      params: { id: sessionId },
    })
  }
}

const filteredSessions = computed(() =>
  filterTeacherSessions(sessions.value, filterStatus.value, searchTerm.value),
)

onMounted(() => {
  fetchSessions()
})
</script>

<template>
  <div class="container mt-4 text-white">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Pulpit Wykładowcy 👨‍🏫</h1>

      <div class="d-flex align-items-center">
        <div
          class="rounded-circle text-white d-flex align-items-center justify-content-center me-3 fw-bold shadow-sm"
          style="width: 45px; height: 45px; font-size: 1.1rem; background-color: #5d26c1"
          title="Zalogowany użytkownik"
        >
          {{ authStore.user?.name?.[0] }}{{ authStore.user?.surname?.[0] }}
        </div>
        <button class="btn btn-outline-danger btn-sm" @click="handleLogout">Wyloguj</button>
      </div>
    </div>

    <div class="card shadow bg-dark text-white border-secondary">
      <div
        class="card-header text-white d-flex justify-content-between align-items-center border-secondary"
        style="background-color: #5d26c1"
      >
        <span class="fs-5">Moje Zajęcia</span>
        <button
          class="btn btn-sm btn-light fw-bold"
          style="color: #5d26c1"
          @click="fetchSessions"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
          Odśwież
        </button>
      </div>

      <div class="card-body border-bottom border-secondary p-3">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-dark text-white border-secondary">📅 Pokaż:</span>
              <select
                v-model="filterStatus"
                class="form-select form-select-dark bg-dark text-white border-secondary fw-bold"
              >
                <option value="today">Aktualne (Dziś)</option>
                <option value="tomorrow">Jutro</option>
                <option value="nextWeek">Następny tydzień</option>
                <option value="past">Minione</option>
                <option value="all_date">Wszystkie: wg dat</option>
                <option value="all_text">Wszystkie: wg tekstu</option>
              </select>
            </div>
          </div>

          <div class="col-md-3 d-none d-md-block"></div>

          <div class="col-12 col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-dark text-white border-secondary border-end-0"> 🔍 </span>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control bg-dark text-white border-secondary border-start-0 ps-0"
                placeholder="Szukaj..."
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div v-if="isLoading" class="text-center p-5">
          <div class="spinner-border" style="color: #5d26c1" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div
          v-else-if="filteredSessions.length === 0"
          class="alert alert-secondary bg-dark text-white-50 border-secondary m-3 text-center"
        >
          Brak zajęć spełniających kryteria.
        </div>

        <div v-else class="list-group list-group-flush">
          <div
            v-for="session in filteredSessions"
            :key="session.courseSessionId"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 bg-dark text-white border-secondary dark-hover-item"
            @click="goToSessionCheck(session.courseSessionId)"
            style="cursor: pointer"
          >
            <div>
              <div class="d-flex align-items-center mb-1 flex-wrap gap-2">
                <h5 class="fw-bold mb-0" style="color: #5d26c1">{{ session.courseName }}</h5>
                <span class="badge bg-secondary">{{ session.courseGroupName }}</span>
                <span
                  v-if="new Date(session.dateStart!).toDateString() === new Date().toDateString()"
                  class="badge bg-success"
                  >Dzisiaj</span
                >
              </div>
              <small class="text-white-50">
                📅 {{ formatDateTime(session.dateStart) }}
                <span class="mx-1">|</span>
                📍 {{ session.locationName || 'Sala nieustalona' }}
              </small>
            </div>

            <span class="fs-4 text-white-50 ms-3">➔</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-select:focus,
.form-control:focus {
  border-color: #5d26c1;
  box-shadow: 0 0 0 0.25rem rgba(93, 38, 193, 0.25);
  background-color: #212529;
  color: white;
}

.input-group:focus-within .input-group-text {
  border-color: #5d26c1;
}

.dark-hover-item:hover {
  background-color: #2c3035 !important;
  color: white !important;
}

::placeholder {
  color: #adb5bd !important;
  opacity: 1;
}
</style>
