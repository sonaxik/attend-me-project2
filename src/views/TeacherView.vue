<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {Backend} from '@/main'
import {useAuthStore} from '@/stores/auth'
import {useRouter} from 'vue-router'
import type {CourseSessionListItem} from '@/backend/AttendMeBackendClientBase'

const sessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const authStore = useAuthStore()
const router = useRouter()

function handleLogout()
{
    authStore.logout()
    router.push('/login')
}

function formatDate(date: Date | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(async ()=>{
    try
    {
        const response = await Backend.courseTeacherSessionsGet({ pageNumber: 1, pageSize: 100})
        sessions.value = response.items || []
    } catch (error)
    {
        console.error("Nie można pobrać zajęć")
    } finally
    {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="container mt-4">
        <div class="mb-4">
            <h1>Pulpit Wykładowcy</h1>
            <div>
                <span> Witaj, {{authStore.user?.name}}{{authStore.user?.surname}}</span>
                <button @click="handleLogout">Wyloguj</button>
            </div>
        </div>

        <div class="card shadow">
      <div class="card-header bg-primary text-white">
        Moje Zajęcia
      </div>
      <div class="card-body">
        
        <div v-if="isLoading" class="text-center p-3">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="sessions.length === 0" class="alert alert-info">
          Brak zaplanowanych zajęć.
        </div>

        <table v-else class="table table-hover">
          <thead>
            <tr>
              <th>Przedmiot</th>
              <th>Termin</th>
              <th>Grupa</th>
              <th>Akcja</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.courseSessionId">
              <td>{{ session.courseName }}</td>
              <td>{{ formatDate(session.dateStart)}}</td>
              <td>{{ session.courseGroupName }}</td>
              <td>
              <button class="btn btn-primary btn-sm">Sprawdź obecność</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>