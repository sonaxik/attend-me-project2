<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router';

const loginName = ref('')
const pass = ref('')
const errorMessage = ref("")

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  errorMessage.value = '';

  try {
    const success = await authStore.login(loginName.value, pass.value);

    if (success) {
      const role = authStore.isTeacher;
      if (role == true) {
        await router.push('/TeacherView');
      }
      else if (role == false) {
        await router.push('/StudentView');
      }
      else {
        await router.push('/');
      }
    } else {
      errorMessage.value = 'Nieprawidłowy login lub hasło';
    }
  } catch (e) {
    errorMessage.value = 'Nieprawidłowy login lub hasło';
    console.error(e);
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <section class="vh-100">
      <div class="container py-5 h-100">
        <div class="row d-flex justify-content-center align-items-center h-100">
          <div class="col-12 col-md-8 col-lg-6 col-xl-5">
            <div class="card bg-dark text-white" style="border-radius: 1rem;">
              <div class="card-body p-5 text-center">

                <div class="mb-md-4 mt-md-4">
                  <h1 class="bi bi-cone-striped pb-3"></h1>

                  <h2 class="fw-bold mb-2 text-uppercase">Login</h2>
                  <p class="text-white-50 mb-5">Please enter your login and password!</p>

                  <div data-mdb-input-init class="form-outline form-white mb-4">
                    <input v-model="loginName" type="text" id="loginX" class="form-control form-control-lg" />
                    <label class="form-label" for="loginX">Login</label>
                  </div>

                  <div data-mdb-input-init class="form-outline form-white mb-4">
                    <input v-model="pass" type="password" id="passwordX" class="form-control form-control-lg" />
                    <label class="form-label" for="passwordX">Password</label>
                  </div>

                  <button data-mdb-button-init data-mdb-ripple-init class="btn btn-outline-light btn-lg px-5" type="submit">Login</button>

                  <div v-if="errorMessage">
                    <p class="text-danger mt-3">{{ errorMessage }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </form>
</template>

<style scoped>
/* Dodane style, aby inputy były czarne */
.form-control {
  background-color: #212529; /* Ciemne tło */
  color: #fff;               /* Biały tekst */
  border: 1px solid #4f4f4f; /* Szara ramka */
}

/* Styl po kliknięciu w input (focus) - żeby nie robił się biały */
.form-control:focus {
  background-color: #212529;
  color: #fff;
  border-color: #fff;
  box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.25);
}

/* Kolor etykiet wewnątrz inputów (placeholderów) */
::placeholder {
  color: #adb5bd;
}
</style>
