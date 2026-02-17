<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Backend } from '@/main';
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
  const first = sessions.value[0];
  return {
    name: first.courseName,
    group: first.courseGroupName,
    location: first.locationName
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

function isActive(start?: Date, end?: Date): boolean {
  if (!start || !end) return false;
  const now = new Date();
  return new Date(start) <= now && new Date(end) >= now;
}

function formatDate(date?: Date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('pl-PL', { 
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
  });
}

function handleRegisterPresence() {
  if (!isDeviceRegistered.value) {
    alert("Twoje urządzenie nie jest zarejestrowane! Poproś prowadzącego o link rejestracyjny.");
    return;
  }
  alert("Tu otworzy się Twój kod QR (widok w trakcie budowy).");
}

async function handleResetDevice() {
    if(!confirm("Czy na pewno chcesz odłączyć to urządzenie?")) return;
    
    try {
        await Backend.deviceAuthReset();
        localStorage.removeItem('device_token');
        isDeviceRegistered.value = false;
        alert("Urządzenie odłączone.");
    } catch (error) {
        console.error("Błąd resetowania:", error);
        alert("Wystąpił błąd podczas resetowania.");
    }
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
    router.push('/student');
}

onMounted(() => {
  isDeviceRegistered.value = !!localStorage.getItem('device_token');
  fetchData();
});
</script>

<template>
  <div class="container mt-4 mb-5">
    <button @click="goBack" class="btn btn-outline-secondary mb-3">← Wróć</button>

    <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="!courseInfo" class="alert alert-warning">
        Nie znaleziono danych kursu.
    </div>

    <div v-else>
        <div class="card shadow mb-4">
            <div class="card-body">
                <h2 class="card-title text-primary fw-bold">{{ courseInfo.name }}</h2>
                
                <h5 class="text-muted">Grupa: {{ courseInfo.group || 'Standardowa' }}</h5>
                <p class="mb-0">{{ courseInfo.location || 'Brak danych o sali' }}</p>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6 mb-2">
                <div class="card bg-light border-success h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title text-success">Frekwencja</h5>
                        <h1 class="display-4 fw-bold">{{ stats.attendance }}%</h1>
                        <p class="card-text">Obecny na {{ stats.presentCount }} z {{ stats.pastCount }} zajęć</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-2">
                <div class="card bg-light border-info h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title text-info">Zaawansowanie kursu</h5>
                        <div class="progress mt-3" style="height: 25px;">
                            <div class="progress-bar bg-info" role="progressbar" 
                                 :style="{ width: stats.progress + '%' }">
                                 {{ stats.progress }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
            <div>
                <strong>Status urządzenia: </strong>
                <span v-if="isDeviceRegistered" class="text-success">✅ Zarejestrowane</span>
                <span v-else class="text-danger">Nieznane</span>
            </div>
            
            <div>
                <button v-if="isDeviceRegistered" @click="handleResetDevice" class="btn btn-sm btn-outline-danger me-2">
                    Odłącz
                </button>
                <button @click="fetchData" class="btn btn-sm btn-outline-primary">
                    Odśwież
                </button>
            </div>
        </div>

        <h4 class="mb-3">Harmonogram i Obecności</h4>
        <div class="list-group">
            <div v-for="session in sessions" :key="session.courseSessionId" 
                 class="list-group-item d-flex justify-content-between align-items-center"
                 :class="{ 'list-group-item-warning': isActive(session.dateStart, session.dateEnd) }"
            >
                <div>
                    <div class="fw-bold">
                        {{ formatDate(session.dateStart) }}
                        <span v-if="isActive(session.dateStart, session.dateEnd)" class="badge bg-warning text-dark ms-2">
                            TRWAJĄ TERAZ
                        </span>
                    </div>
                </div>

                <div class="text-end">
                    <div v-if="isActive(session.dateStart, session.dateEnd)">
                         <button @click="handleRegisterPresence" class="btn btn-success fw-bold pulse-btn">
                            📱 Rejestruj Obecność
                         </button>
                    </div>
                    
                    <div v-else-if="session.dateEnd && new Date(session.dateEnd) < new Date()">
                        <span v-if="isPresent(session.courseSessionId)" class="badge bg-success rounded-pill p-2">
                            OBECNY
                        </span>
                        <span v-else class="badge bg-danger rounded-pill p-2">
                            NIEOBECNY
                        </span>
                    </div>

                    <div v-else>
                        <span class="badge bg-secondary rounded-pill">Nadchodzące</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>