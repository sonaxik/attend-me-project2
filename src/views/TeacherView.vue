<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Backend } from '@/main'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { CourseSessionListItem } from '@/backend/AttendMeBackendClientBase'

const sessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)

type FilterType = 'today' | 'tomorrow' | 'nextWeek' | 'past' | 'all_date' | 'all_text';

const filterStatus = ref<FilterType>('all_date')
const searchTerm = ref("")

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

async function fetchSessions() {
  isLoading.value = true
  try {
    const response = await Backend.courseTeacherSessionsGet({ pageNumber: 1, pageSize: 100 })
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
      name: "teacher-session-details",
      params: { id: sessionId }
    });
  }
}

const filteredSessions = computed(() => {
  let result = sessions.value
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(startOfToday.getDate() + 1)

  const startOfTommorow = new Date(startOfToday.getTime()+24 *60*60*1000)
  const endOfTommorow = new Date(startOfTommorow.getTime()+24 *60*60*1000-1)
  const dayOfWeek = now.getDay() || 7
  const daysUntilNextMonday = 8 - dayOfWeek
  const startOfNextWeek = new Date(startOfToday.getTime()+daysUntilNextMonday*24*60*60*1000)
  const endOfNextWeek = new Date(startOfNextWeek.getTime()+7*24*60*60*1000-1)

  switch (filterStatus.value) {
    case 'today':
      result = result.filter(s => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfToday && d < endOfToday
      })
      break
    case 'tomorrow':
      result = result.filter(s => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfTommorow && d < endOfTommorow
      })
      break
    case 'nextWeek':
      result = result.filter(s => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfNextWeek && d <= endOfNextWeek
      })
      break
    case 'past':
      result = result.filter(s => s.dateEnd ? new Date(s.dateEnd) <= now : false)
      break
    case 'all_date':
    case 'all_text':
      break
  }

  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(s =>
      (s.courseName?.toLowerCase().includes(term)) ||
      (s.courseGroupName?.toLowerCase().includes(term)) ||
      (s.locationName?.toLowerCase().includes(term))
    )
  }

  if(filterStatus.value === 'all_text')
  {
    result.sort((a, b) => {
      const dateA = a.dateStart ? new Date(a.dateStart).getTime():0
      const dateB = b.dateStart ? new Date(b.dateStart).getTime():0
      if(filterStatus.value === 'past')
    {
      return dateB - dateA
    }
    return dateA - dateB
    })
  }

  return result
})

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
            style="width: 45px; height: 45px; font-size: 1.1rem; background-color: #5D26C1;"
            title="Zalogowany użytkownik"
        >
            {{ authStore.user?.name?.[0] }}{{ authStore.user?.surname?.[0] }}
        </div>
        <button class="btn btn-outline-danger btn-sm" @click="handleLogout">Wyloguj</button>
      </div>
    </div>

    <div class="card shadow bg-dark text-white border-secondary">
      <div class="card-header text-white d-flex justify-content-between align-items-center border-secondary" style="background-color: #5D26C1;">
        <span class="fs-5">Moje Zajęcia</span>
        <button class="btn btn-sm btn-light fw-bold" style="color: #5D26C1;" @click="fetchSessions" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
          Odśwież
        </button>
      </div>

      <div class="card-body border-bottom border-secondary p-3">
        <div class="row g-3 align-items-center">

          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-dark text-white border-secondary">📅 Pokaż:</span>
              <select v-model="filterStatus" class="form-select form-select-dark bg-dark text-white border-secondary fw-bold">
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
              <span class="input-group-text bg-dark text-white border-secondary border-end-0">
                🔍
              </span>
              <input
                v-model="searchTerm"
                type="text"
                class="form-control bg-dark text-white border-secondary border-start-0 ps-0"
                placeholder="Szukaj..."
              >
            </div>
          </div>

        </div>
      </div>

      <div class="card-body p-0">

        <div v-if="isLoading" class="text-center p-5">
          <div class="spinner-border" style="color: #5D26C1;" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="filteredSessions.length === 0" class="alert alert-secondary bg-dark text-white-50 border-secondary m-3 text-center">
           Brak zajęć spełniających kryteria.
        </div>

        <div v-else class="list-group list-group-flush">
          <div
            v-for="session in filteredSessions"
            :key="session.courseSessionId"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 bg-dark text-white border-secondary dark-hover-item"
            @click="goToSessionCheck(session.courseSessionId)"
            style="cursor: pointer;"
          >
            <div>
              <div class="d-flex align-items-center mb-1 flex-wrap gap-2">
                <h5 class="fw-bold mb-0" style="color: #5D26C1;">{{ session.courseName }}</h5>
                <span class="badge bg-secondary">{{ session.courseGroupName }}</span>
                <span v-if="new Date(session.dateStart!).toDateString() === new Date().toDateString()" class="badge bg-success">Dzisiaj</span>
              </div>
              <small class="text-white-50">
                📅 {{ formatDate(session.dateStart) }}
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
/* Focus na fioletowo */
.form-select:focus, .form-control:focus {
  border-color: #5D26C1;
  box-shadow: 0 0 0 0.25rem rgba(93, 38, 193, 0.25);
  background-color: #212529;
  color: white;
}

.input-group:focus-within .input-group-text {
    border-color: #5D26C1;
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
