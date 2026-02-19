<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Backend } from '@/main'

const route = useRoute()
const router = useRouter()

const token = ref('')
const isRegistered = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

const formData = ref({
  deviceName: '',
  studentName: '',
  studentSurname: '',
  albumIdNumber: undefined as number | undefined
})

onMounted(() => {
  const queryToken = route.query.token as string
  if (queryToken) {
    token.value = queryToken
  } else {
    errorMsg.value = "Błąd: Brak tokenu w linku. Poproś wykładowcę o nowy link."
  }
})

async function handleRegister() {
  if (!token.value) return
  isLoading.value = true
  errorMsg.value = ''

  try {
    await Backend.userDeviceRegisterWithToken(token.value, {
      deviceName: formData.value.deviceName,
      studentName: formData.value.studentName,
      studentSurname: formData.value.studentSurname,
      albumIdNumber: formData.value.albumIdNumber
    })

    isRegistered.value = true
  } catch (error) {
    console.error(error)
    errorMsg.value = "Wystąpił błąd podczas rejestracji. Sprawdź dane lub poproś o nowy link."
  } finally {
    isLoading.value = false
  }
}

function goToDashboard() {
  router.push('/login')
}
</script>

<template>
  <div class="container d-flex justify-content-center align-items-center min-vh-100 text-white">

    <div v-if="isRegistered" class="card shadow bg-dark text-white border-secondary text-center p-5" style="max-width: 500px; width: 100%;">
      <div class="card-body">
        <div class="display-1 mb-4 text-success">✅</div>
        <h2 class="mb-3 fw-bold">Sukces!</h2>
        <p class="fs-5 mb-4">Twoje urządzenie zostało pomyślnie zarejestrowane.</p>
        <p class="text-white-50 mb-5">Możesz teraz skanować obecność na zajęciach.</p>
        <button class="btn btn-primary btn-lg fw-bold w-100" @click="goToDashboard">
          Przejdź do Pulpitu
        </button>
      </div>
    </div>

    <div v-else class="card shadow bg-dark text-white border-secondary" style="max-width: 500px; width: 100%;">
      <div class="card-header border-secondary text-center py-4">
        <h3 class="mb-0 fw-bold">Rejestracja Urządzenia 📱</h3>
      </div>
      <div class="card-body p-4 p-md-5">

        <div v-if="errorMsg" class="alert alert-danger mb-4">
          {{ errorMsg }}
        </div>

        <p class="text-white-50 mb-4 text-center">
          Wypełnij poniższe dane, aby powiązać to urządzenie ze swoim kontem studenta.
        </p>

        <form @submit.prevent="handleRegister">
          <div class="mb-4">
            <label class="form-label fw-bold">Imię</label>
            <input v-model="formData.studentName" type="text" class="form-control form-control-lg bg-dark text-white border-secondary dark-input dark-placeholder" required placeholder="Jan">
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Nazwisko</label>
            <input v-model="formData.studentSurname" type="text" class="form-control form-control-lg bg-dark text-white border-secondary dark-input dark-placeholder" required placeholder="Kowalski">
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Numer Indeksu</label>
            <input v-model="formData.albumIdNumber" type="number" class="form-control form-control-lg bg-dark text-white border-secondary dark-input dark-placeholder" required placeholder="12345">
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Nazwa Urządzenia</label>
            <input v-model="formData.deviceName" type="text" class="form-control form-control-lg bg-dark text-white border-secondary dark-input dark-placeholder" required placeholder="np. Telefon Jana">
            </div>

          <div class="d-grid mt-5">
            <button type="submit" class="btn btn-primary btn-lg fw-bold py-3" :disabled="isLoading || !token">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              Aktywuj Urządzenie
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

