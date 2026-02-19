<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Backend } from '@/main'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { CourseSessionListItem } from '@/backend/AttendMeBackendClientBase'

const sessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const authStore = useAuthStore()
const router = useRouter()

const isDeviceRegistered = computed(() => !!Backend.deviceTokenResult?.token)

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

function goToCourseDetails(groupId: number | undefined) {
  if(groupId) {
    router.push({
      name: "student-course-details",
      params: {id: groupId}
    });
  }
}

function goToScanner() {

  if(!isDeviceRegistered.value)
{
  alert("Twoje urządzenie nie jest zarejstrowane");
  return;
}
router.push({name: 'student-qr'});
}

onMounted(async () => {
  try {
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
  <div class="container mt-4 text-white">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Panel Studenta 🎓</h1>

      <div class="d-flex align-items-center">
        <div
            class="rounded-circle text-white d-flex align-items-center justify-content-center me-3 fw-bold shadow-sm"
            style="width: 45px; height: 45px; font-size: 1.1rem; background-color: #59C173;"
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
            <h4 class="mb-1 fw-bold" style="color: #59C173;">Jesteś na zajęciach?</h4>
            <p class="mb-0 text-white-50">Wygeneruj kod, aby potwierdzić obecność.</p>
          </div>
          <button class="btn btn-lg fw-bold text-white border-0" style="background-color: #59C173;" @click="goToScanner">
            📷 Rejestruj obecność
          </button>
        </div>
      </div>
    </div>

    <div class="card shadow bg-dark text-white border-secondary">
      <div class="card-header text-white border-secondary" style="background-color: #59C173;">
        <span class="fs-5">Nadchodzące Zajęcia</span>
      </div>

      <div class="card-body p-0">

        <div v-if="isLoading" class="text-center p-5">
          <div class="spinner-border" style="color: #59C173;" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="sessions.length === 0" class="alert alert-secondary bg-dark text-white-50 border-secondary m-3 text-center">
          Brak nadchodzących zajęć.
        </div>

        <div v-else class="list-group list-group-flush">
          <div
            v-for="session in sessions"
            :key="session.courseSessionId"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 bg-dark text-white border-secondary dark-hover-item"
            @click="goToCourseDetails(session.courseGroupId)"
            style="cursor: pointer;"
          >
            <div>
              <h5 class="mb-1 fw-bold" style="color: #59C173;">{{ session.courseName }}</h5>
              <small class="text-white-50">
                📅 {{ formatDate(session.dateStart) }}
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
/* Hover efekt dla listy */
.dark-hover-item:hover {
  background-color: #2c3035 !important;
  color: white !important;
}
</style>
