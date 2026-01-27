<script setup lang="ts">
import {ref} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {useRouter} from 'vue-router';

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
        if(role == true)
    {
        await router.push('/TeacherView');
    }
    else if (role == false)
    {
        await router.push('/StudentView');
    }
    else
    {
        await router.push('/');
    }
    } else {
      errorMessage.value = 'Nieprawidłowy login lub hasło';
    }
  } catch (e) {
    errorMessage.value = 'Nieprawidłowy login lub hasło';
  }
}

</script>

<template>
    <div class="container">
        <h2>Logowanie</h2>
        <form @submit.prevent="handleLogin">

            <div class="form-group">
                <label>Login: </label>
                <input v-model="loginName" type="text" required placeholder="Podaj login">
            </div>

            <div class="form-group">
                <label>Hasło: </label>
                <input v-model="pass" type="text" required placeholder="Podaj hasło">
            </div>
            <div v-if="errorMessage" class="error-message">
                {{errorMessage}}
            </div>
            <button type="submit">Zaloguj się</button>
        </form>
    </div>
</template>