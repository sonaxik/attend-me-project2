<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Backend } from '@/main';
import QrcodeVue from 'qrcode.vue';

const router = useRouter();
const qrCodeValue = ref("");
const isLoading = ref(true);
const errorMessage = ref("");
let timer: number | null = null;

async function fetchTicket() {
  try {
    const result = await Backend.userAttendanceTicketGet();

    if (result.token) {
        qrCodeValue.value = result.token;
        isLoading.value = false;
    }
  } catch (error) {
    console.error("Błąd pobierania ticketa:", error);
    errorMessage.value = "Nie udało się pobrać kodu. Upewnij się, że urządzenie jest zarejestrowane.";
  }
}

onMounted(() => {
  fetchTicket();
  timer = window.setInterval(fetchTicket, 2000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function goBack() {
  router.back();
}
</script>

<template>
  <div class="container mt-4 mb-5 text-white d-flex flex-column align-items-center">

    <div class="w-100 d-flex align-items-center mb-4">
      <button
        class="btn subpage-back-btn rounded-circle d-flex align-items-center justify-content-center me-3"
        style="width: 45px; height: 45px;"
        @click="goBack"
      >
        <i class="bi bi-arrow-left fs-4"></i>
      </button>
      <h1 class="mb-0 fs-3">Rejestracja obecności</h1>
    </div>

    <div class="card shadow bg-dark text-white border-secondary text-center p-4 w-100" style="max-width: 450px;">
      <h4 class="fw-bold mb-3" style="color: #59C173;">Twój Kod Obecności</h4>

      <p class="text-white-50 mb-4 small">
        Pokaż ten ekran wykładowcy. Zbliż telefon do kamery urządzenia skanującego.
      </p>

      <div v-if="errorMessage" class="alert alert-danger border-danger text-danger bg-danger bg-opacity-10">
        {{ errorMessage }}
      </div>

      <div v-else class="qr-box bg-white p-3 rounded d-inline-block mx-auto mb-4">
        <div v-if="isLoading" class="d-flex justify-content-center align-items-center" style="width: 250px; height: 250px;">
          <div class="spinner-border" style="color: #59C173;" role="status"></div>
        </div>

        <qrcode-vue
            v-else
            :value="qrCodeValue"
            :size="250"
            level="H"
            background="#ffffff"
            foreground="#000000"
        />
      </div>

      <div class="d-flex align-items-center justify-content-center text-muted small">
        <div class="spinner-grow spinner-grow-sm me-2" style="color: #59C173;" role="status"></div>
        <span class="text-white-50">Kod odświeża się automatycznie co 2s</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-box {
  border: 4px solid #59C173;
}
</style>
