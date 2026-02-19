<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Backend } from '@/main';
import { formatDateOnly, formatTimeOnly, isSessionActive } from '@/helpers/dateUtils';
import type { CourseSessionListItem, AttendanceLog } from '@/backend/AttendMeBackendClientBase';

const route = useRoute();
const router = useRouter();
const groupId = parseInt(route.params.id as string);

const sessions = ref<CourseSessionListItem[]>([]);
const attendanceLogs = ref<AttendanceLog[]>([]);
const isLoading = ref(true);

const isDeviceRegistered = ref(false);

const courseInfo = computed(() => {
  if (sessions.value.length === 0) return null;

  const now = new Date();
  const nextSession = sessions.value.find(s => s.dateEnd && new Date(s.dateEnd) >= now) || sessions.value[0];

  return {
    name: nextSession.courseName,
    group: nextSession.courseGroupName,
    location: nextSession.locationName,
    dateStart: nextSession.dateStart,
    dateEnd: nextSession.dateEnd
  };
});

const stats = computed(() => {
  const totalSessions = sessions.value.length;
  if (totalSessions === 0) return { progress: 0, attendance: 0, presentCount: 0, pastCount: 0 };

  const now = new Date();
  const pastSessions = sessions.value.filter(s => s.dateEnd && new Date(s.dateEnd) < now);

  const presentCount = attendanceLogs.value.length;

  const progress = Math.round((pastSessions.length / totalSessions) * 100);

  const attendancePct = pastSessions.length > 0
    ? Math.round((presentCount / pastSessions.length) * 100)
    : 100;

  return {
    progress,
    attendance: attendancePct,
    presentCount,
    pastCount: pastSessions.length
  };
});

function isPresent(sessionId: number | undefined): boolean {
  if (!sessionId) return false;
  return attendanceLogs.value.some(log => log.courseSessionId === sessionId);
}

function handleRegisterPresence() {
  if (!isDeviceRegistered.value) {
    alert("Twoje urządzenie nie jest zarejestrowane! Poproś prowadzącego o link rejestracyjny.");
    return;
  }
  router.push({ name: 'student-qr' });
}

async function fetchData() {
  isLoading.value = true;
  try {
    const sessionsData = await Backend.courseStudentGroupSessionsGet(groupId);
    sessions.value = sessionsData || [];

    const attendanceData = await Backend.courseStudentAttendanceGet(groupId);
    attendanceLogs.value = attendanceData || [];

  } catch (error) {
    console.error("Błąd pobierania danych kursu:", error);
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
    router.back();
}

onMounted(() => {
  isDeviceRegistered.value = !!localStorage.getItem('attend-me:deviceAuthData');
  fetchData();
});
</script>

<template>
  <div class="container mt-4 mb-5 text-white">
    <div class="d-flex align-items-center mb-4">
      <button
        class="btn subpage-back-btn rounded-circle d-flex align-items-center justify-content-center me-3"
        style="width: 45px; height: 45px;"
        @click="goBack"
        title="Wróć"
      >
        <i class="bi bi-arrow-left fs-4"></i>
      </button>

      <h1 class="mb-0 fs-3">Szczegóły przedmiotu</h1>
    </div>

    <div v-if="isLoading" class="text-center p-5">
        <div class="spinner-border" style="color: #59C173;" role="status"></div>
    </div>

    <div v-else-if="!courseInfo" class="alert alert-secondary bg-dark text-white-50 border-secondary">
        Nie znaleziono danych kursu.
    </div>

    <div v-else>
        <div class="card shadow mb-4 bg-dark text-white border-secondary">
            <div class="card-body">
                <h2 class="card-title fw-bold" style="color: #59C173;">{{ courseInfo.name }}</h2>
                <h5 class="text-white-50 mb-3">Grupa: {{ courseInfo.group || 'Standardowa' }}</h5>

                <p class="mb-1 text-white-50">
                    📅 Termin: {{ formatDateOnly(courseInfo.dateStart) }}, {{ formatTimeOnly(courseInfo.dateStart) }} - {{ formatTimeOnly(courseInfo.dateEnd) }}
                </p>
                <p class="mb-0 text-white-50">📍 Sala: {{ courseInfo.location || 'Brak danych o sali' }}</p>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6 mb-2">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body text-center text-white">
                        <h5 class="card-title" style="color: #59C173;">Frekwencja</h5>
                        <h1 class="display-4 fw-bold">{{ stats.attendance }}%</h1>
                        <p class="card-text text-white-50">Obecny na {{ stats.presentCount }} z {{ stats.pastCount }} zajęć</p>
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-2">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body text-center text-white">
                        <h5 class="card-title" style="color: #59C173;">Zaawansowanie kursu</h5>
                        <div class="progress mt-4 bg-secondary" style="height: 25px;">
                            <div class="progress-bar fw-bold" role="progressbar"
                                 :style="{ width: stats.progress + '%', backgroundColor: '#59C173' }">
                                 {{ stats.progress }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow bg-dark text-white border-secondary">

            <div class="card-header d-flex justify-content-between align-items-center border-secondary bg-dark">
                <span class="fs-5 fw-bold" style="color: #59C173;">Harmonogram i Obecności</span>

                <button @click="fetchData" class="btn btn-sm btn-light subpage-refresh-btn" style="color: #59C173;">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                    Odśwież
                </button>
            </div>

            <div class="card-body p-0">
                <div class="list-group list-group-flush">
                    <div v-for="session in sessions" :key="session.courseSessionId"
                         class="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary p-3"
                         :class="{ 'border-active': isSessionActive(session.dateStart, session.dateEnd) }"
                    >
                        <div class="d-flex flex-column text-start">
                            <span class="fw-bold fs-5">{{ session.courseName }}</span>

                            <span class="text-white-50 small mb-1">
                                📅 {{ formatDateOnly(session.dateStart) }} | 🕒 {{ formatTimeOnly(session.dateStart) }} - {{ formatTimeOnly(session.dateEnd) }}
                            </span>

                            <span v-if="isSessionActive(session.dateStart, session.dateEnd)" class="badge bg-warning text-dark w-auto align-self-start mt-1">
                                🔥 TRWAJĄ TERAZ
                            </span>
                        </div>

                        <div class="text-end">
                            <div v-if="isSessionActive(session.dateStart, session.dateEnd)">
                                 <button @click="handleRegisterPresence" class="btn fw-bold text-white pulse-btn" style="background-color: #59C173;">
                                    📱 Rejestruj Obecność
                                 </button>
                            </div>

                            <div v-else-if="session.dateEnd && new Date(session.dateEnd) < new Date()">
                                <span v-if="isPresent(session.courseSessionId)" class="badge bg-success rounded-pill p-2 px-3">
                                    OBECNY
                                </span>
                                <span v-else class="badge bg-danger rounded-pill p-2 px-3">
                                    NIEOBECNY
                                </span>
                            </div>

                            <div v-else>
                                <span class="badge bg-secondary rounded-pill p-2 px-3">Nadchodzące</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(89, 193, 115, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(89, 193, 115, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(89, 193, 115, 0); }
}

.pulse-btn {
    animation: pulse 2s infinite;
}

.border-active {
    background-color: #262a2e !important;
    border-left: 4px solid #ffc107 !important;
}

.list-group-item:hover {
    background-color: #2c3035 !important;
}
</style>
