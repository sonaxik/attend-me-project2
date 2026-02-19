<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Backend } from '@/main'
import type {
  CourseSessionAttendanceRecord,
  CourseSessionListItem,
} from '@/backend/AttendMeBackendClientBase'
import { Modal } from 'bootstrap'
import { formatDateTime } from '@/helpers/dateUtils'

const route = useRoute()
const router = useRouter()

const session = ref<CourseSessionListItem | null>(null)
const attendanceList = ref<CourseSessionAttendanceRecord[]>([])
const isLoading = ref(true)

const modalInstance = ref<Modal | null>(null)
const isLoadingDevices = ref(false)
const studentDevices = ref<Record<number, string | null>>({})

const sessionId = Number(route.params.id)

async function fetchData() {
  isLoading.value = true
  try {
    session.value = await Backend.courseTeacherSessionGet(sessionId)
    attendanceList.value = await Backend.courseSessionAttendanceListGet(sessionId)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function toggleAttendance(student: CourseSessionAttendanceRecord) {
  if (!student.attenderUserId) return
  const newStatus = !student.wasUserPresent
  try {
    await Backend.courseSessionAttendanceToggle(student.attenderUserId, sessionId, newStatus)
    await fetchData()
  } catch (error) {
    console.error('Błąd zapisu obecności:', error)
    alert('Nie udało się zmienić statusu obecności.')
  }
}

async function fetchStudentDevices() {
  isLoadingDevices.value = true
  studentDevices.value = {}

  const promises = attendanceList.value.map(async (student) => {
    if (student.attenderUserId) {
      try {
        const user = await Backend.userGet(student.attenderUserId)
        if (user && user.deviceName) {
          studentDevices.value[student.attenderUserId] = user.deviceName
        } else {
          studentDevices.value[student.attenderUserId] = null
        }
      } catch (e) {
        console.error(`Błąd pobierania danych studenta ${student.attenderUserId}`, e)
      }
    }
  })

  await Promise.all(promises)
  isLoadingDevices.value = false
}

function openDeviceModal() {
  const modalEl = document.getElementById('deviceModal')
  if (modalEl) {
    modalInstance.value = new Modal(modalEl)
    modalInstance.value.show()
    fetchStudentDevices()
  }
}

async function copyRegistrationLink(studentId: number | undefined) {
  if (!studentId) return
  try {
    const tokenResult = await Backend.userDeviceRegisterTokenGet(studentId)
    if (tokenResult && tokenResult.token) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/student/device-register?token=${encodeURIComponent(tokenResult.token)}`
      await navigator.clipboard.writeText(link)
      alert('✅ Link skopiowany do schowka!\nWyślij go studentowi.')
    } else {
      alert('Błąd: Nie udało się wygenerować tokenu.')
    }
  } catch (error) {
    console.error('Błąd generowania linku:', error)
    alert('Wystąpił błąd podczas generowania linku.')
  }
}

async function resetDevice(studentId: number | undefined) {
  if (!studentId) return
  if (!confirm('Czy na pewno chcesz usunąć to urządzenie?')) return
  try {
    await Backend.userDeviceReset(studentId)
    studentDevices.value[studentId] = null
    alert('Urządzenie zostało usunięte.')
  } catch (error) {
    console.error('Błąd resetowania urządzenia:', error)
    alert('Wystąpił błąd podczas usuwania urządzenia.')
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  if (sessionId) {
    fetchData()
  } else {
    router.push('/teacher')
  }
})
</script>

<template>
  <div class="container mt-4 text-white">
    <div class="d-flex align-items-center mb-4">
      <button
        class="btn subpage-back-btn rounded-circle d-flex align-items-center justify-content-center me-3"
        style="width: 45px; height: 45px"
        @click="goBack"
        title="Wróć"
      >
        <i class="bi bi-arrow-left fs-4"></i>
      </button>

      <h1 class="mb-0 fs-3">Szczegóły zajęć</h1>
    </div>

    <div v-if="isLoading" class="text-center p-5">
      <div class="spinner-border" style="color: #5d26c1" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="session">
      <div class="card shadow bg-dark text-white border-secondary mb-4">
        <div class="card-header border-secondary d-flex justify-content-between align-items-center">
          <span class="fw-bold text-uppercase tracking-wider" style="color: #5d26c1"
            >Sygnatura zajęć</span
          >
          <span class="badge bg-secondary">{{ session.courseGroupName }}</span>
        </div>
        <div class="card-body">
          <h2 class="card-title fw-bold mb-3">{{ session.courseName }}</h2>

          <div class="row g-3">
            <div class="col-md-6">
              <div class="d-flex align-items-center">
                <span class="fs-4 me-3">📅</span>
                <div>
                  <small class="text-white-50 d-block">Termin</small>
                  <span class="fw-bold">{{ formatDateTime(session.dateStart) }}</span>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <span class="fs-4 me-3">📍</span>
                  <div>
                    <small class="text-white-50 d-block">Sala</small>
                    <span class="fw-bold">{{ session.locationName || 'Brak danych' }}</span>
                  </div>
                </div>

                <button class="btn btn-outline-light btn-sm ms-2" @click="openDeviceModal">
                  📱 Zarządzaj urządzeniami
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow bg-dark text-white border-secondary">
        <div class="card-header border-secondary bg-dark d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-5">Lista obecności</span>
            <span class="badge rounded-pill" style="background-color: #5d26c1">
              {{ attendanceList.filter((s) => s.wasUserPresent).length }} / {{ attendanceList.length }}
            </span>
          </div>
          <button
            class="btn btn-sm btn-light subpage-refresh-btn"
            style="color: #5d26c1"
            @click="fetchData"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
            Odśwież
          </button>
        </div>

        <div class="card-body p-0">
          <div v-if="attendanceList.length === 0" class="p-4 text-center text-white-50">
            Brak studentów przypisanych do tej grupy.
          </div>

          <ul v-else class="list-group list-group-flush">
            <li
              v-for="student in attendanceList"
              :key="student.attenderUserId"
              class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center p-3"
            >
              <div class="d-flex align-items-center gap-3">
                <div
                  class="avatar d-flex align-items-center justify-content-center rounded-circle fw-bold"
                  :style="{ backgroundColor: student.wasUserPresent ? '#59C173' : '#6c757d' }"
                  style="width: 40px; height: 40px; color: white"
                >
                  {{ student.userName?.[0] }}{{ student.userSurname?.[0] }}
                </div>
                <div>
                  <div class="fw-bold">{{ student.userName }} {{ student.userSurname }}</div>
                  <small class="text-white-50"
                    >Indeks: {{ student.studentAlbumIdNumber || '---' }}</small
                  >
                </div>
              </div>

              <div class="form-check form-switch fs-4">
                <input
                  class="form-check-input student-checkbox"
                  type="checkbox"
                  role="switch"
                  :checked="!!student.wasUserPresent"
                  @change="toggleAttendance(student)"
                  style="cursor: pointer"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="modal fade" id="deviceModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content bg-dark text-white border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title">Urządzenia studentów</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="isLoadingDevices" class="text-center py-5">
              <div class="spinner-border" style="color: #5d26c1" role="status">
                <span class="visually-hidden">Sprawdzanie urządzeń...</span>
              </div>
              <p class="mt-2 text-white-50">Pobieram informacje o urządzeniach...</p>
            </div>
            <table v-else class="table table-dark table-hover border-secondary align-middle">
              <thead>
                <tr>
                  <th style="width: 50%">Student / Urządzenie</th>
                  <th class="text-end">Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in attendanceList" :key="student.attenderUserId">
                  <td>
                    <div class="fw-bold">{{ student.userName }} {{ student.userSurname }}</div>
                    <div
                      v-if="student.attenderUserId && studentDevices[student.attenderUserId]"
                      style="color: #59c173"
                      class="small"
                    >
                      📱 {{ studentDevices[student.attenderUserId] }}
                    </div>
                    <div v-else class="text-white-50 small fst-italic">
                      Brak zarejestrowanego urządzenia
                    </div>
                  </td>
                  <td class="text-end">
                    <button
                      v-if="student.attenderUserId && studentDevices[student.attenderUserId]"
                      class="btn btn-sm btn-outline-danger me-2"
                      @click="resetDevice(student.attenderUserId)"
                    >
                      🗑️ Usuń
                    </button>
                    <button
                      class="btn btn-sm btn-outline-info"
                      @click="copyRegistrationLink(student.attenderUserId)"
                    >
                      🔗 Link
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-checkbox:checked {
  background-color: #59c173;
  border-color: #59c173;
}
.tracking-wider {
  letter-spacing: 1px;
  font-size: 0.85rem;
}
.list-group-item:hover {
  background-color: #2c3035 !important;
}
.modal-content {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
}
</style>
