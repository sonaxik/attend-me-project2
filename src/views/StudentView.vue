<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Backend } from '@/main'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type {
  AttendanceLog,
  CourseSessionListItem,
  CourseSessionListItemPagedList,
} from '@/backend/AttendMeBackendClientBase'
import { formatDateTime, isSessionActive, isSessionPast } from '@/helpers/dateUtils'
import {
  buildStudentSessionsQuery,
  filterStudentSessions,
  type StudentFilterType,
} from '@/helpers/sessionFilterUtils'

const sessions = ref<CourseSessionListItem[]>([])
const presentSessionIds = ref<number[]>([])
const isLoading = ref(true)
const authStore = useAuthStore()
const router = useRouter()

const filterStatus = ref<StudentFilterType>('all')
const searchTerm = ref('')
const isDeviceRegistered = ref(false)
let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function goToCourseDetails(groupId: number | undefined) {
  if (groupId) {
    router.push({
      name: 'student-course-details',
      params: { id: groupId },
    })
  }
}

function goToScanner() {
  if (!isDeviceRegistered.value) {
    alert('Twoje urządzenie nie jest zarejestrowane. Użyj linku od wykładowcy, aby je dodać.')
    return
  }
  router.push({ name: 'student-qr' })
}

async function fetchSessions() {
  isLoading.value = true
  try {
    const response: CourseSessionListItemPagedList = await Backend.courseStudentSessionsGet(
      buildStudentSessionsQuery(filterStatus.value, searchTerm.value),
    )
    const fetchedSessions: CourseSessionListItem[] = response.items || []
    sessions.value = fetchedSessions

    const groupIds = [
      ...new Set(
        fetchedSessions
          .map((session) => session.courseGroupId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ]
    const attendancePromises = groupIds.map((id) => Backend.courseStudentAttendanceGet(id))
    const attendanceResults = await Promise.all(attendancePromises)

    const presentIds: number[] = []
    attendanceResults.forEach((logs) => {
      if (logs) {
        logs.forEach((log: AttendanceLog) => {
          if (log.courseSessionId) presentIds.push(log.courseSessionId)
        })
      }
    })
    presentSessionIds.value = presentIds
  } catch (error) {
    console.error('Błąd pobierania zajęć:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredSessions = computed(() =>
  filterStudentSessions(sessions.value, filterStatus.value, searchTerm.value),
)

watch([filterStatus, searchTerm], () => {
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
  }
  filterDebounceTimer = setTimeout(() => {
    fetchSessions()
  }, 300)
})

onBeforeUnmount(() => {
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
  }
})

onMounted(() => {
  isDeviceRegistered.value = !!localStorage.getItem('attend-me:deviceAuthData')
  fetchSessions()
})
</script>

<template>
  <div class="container mt-4 text-white">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Panel Studenta 🎓</h1>

      <div class="d-flex align-items-center">
        <div
          class="rounded-circle text-white d-flex align-items-center justify-content-center me-3 fw-bold shadow-sm"
          style="width: 45px; height: 45px; font-size: 1.1rem; background-color: #59c173"
          title="Zalogowany użytkownik"
        >
          {{ authStore.user?.name?.[0] }}{{ authStore.user?.surname?.[0] }}
        </div>
        <button class="btn btn-outline-danger btn-sm" @click="handleLogout">Wyloguj</button>
      </div>
    </div>

    <div v-if="isDeviceRegistered" class="mb-4">
      <div class="card bg-dark text-white border-secondary shadow">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h4 class="mb-1 fw-bold" style="color: #59c173">Jesteś na zajęciach?</h4>
            <p class="mb-0 text-white-50">Wygeneruj kod, aby potwierdzić obecność.</p>
          </div>
          <button
            class="btn btn-lg fw-bold text-white border-0"
            style="background-color: #59c173"
            @click="goToScanner"
          >
            📷 Rejestruj obecność
          </button>
        </div>
      </div>
    </div>

    <div class="card shadow bg-dark text-white border-secondary">
      <div
        class="card-header d-flex justify-content-between align-items-center text-white border-secondary py-3"
        style="background-color: #59c173"
      >
        <span class="fs-5 fw-bold">Moje Zajęcia</span>
        <button
          class="btn btn-sm btn-light fw-bold"
          style="color: #59c173"
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
                <option value="all">Wszystkie zajęcia</option>
                <option value="today">Dzisiaj</option>
                <option value="tomorrow">Jutro</option>
                <option value="week">W tym tygodniu</option>
                <option value="month">W tym miesiącu</option>
                <option value="past">Minione</option>
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
                class="form-control bg-dark text-white border-secondary border-start-0 ps-0 search-input"
                placeholder="Szukaj przedmiotu/sali..."
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div v-if="isLoading" class="text-center p-5">
          <div class="spinner-border" style="color: #59c173" role="status">
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
            @click="goToCourseDetails(session.courseGroupId)"
            style="cursor: pointer"
          >
            <div>
              <div class="d-flex align-items-center mb-1 flex-wrap gap-2">
                <h5 class="mb-1 fw-bold" style="color: #59c173">{{ session.courseName }}</h5>
                <span
                  v-if="new Date(session.dateStart!).toDateString() === new Date().toDateString()"
                  class="badge bg-success"
                  >Dzisiaj</span
                >

                <span
                  v-if="isSessionActive(session.dateStart, session.dateEnd)"
                  class="badge bg-warning text-dark"
                >
                  🔥 Trwają
                </span>
                <span v-else-if="isSessionPast(session.dateEnd)">
                  <span v-if="presentSessionIds.includes(session.courseSessionId!)" class="badge bg-success"
                    >✅ Obecny</span
                  >
                  <span v-else class="badge bg-danger">❌ Nieobecny</span>
                </span>
                <span v-else class="badge bg-secondary text-white-50"> Nadchodzące </span>
              </div>

              <small class="text-white-50">
                📅 {{ formatDateTime(session.dateStart) }}
                <span class="mx-1">|</span>
                📍 {{ session.locationName || 'Sala nieznana' }}
              </small>
            </div>

            <span class="text-white-50 fs-5">➔</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark-hover-item:hover {
  background-color: #2c3035 !important;
  color: white !important;
}

.form-select:focus,
.form-control:focus {
  border-color: #59c173;
  box-shadow: 0 0 0 0.25rem rgba(89, 193, 115, 0.25);
  background-color: #212529;
  color: white;
}

.input-group:focus-within .input-group-text {
  border-color: #59c173;
}

::placeholder {
  color: #adb5bd !important;
  opacity: 1;
}
</style>
