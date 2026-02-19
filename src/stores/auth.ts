import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Backend } from '@/main'
import type { TokenResult, User } from '@/backend/AttendMeBackendClientBase'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(Backend.userTokenResult?.token ?? null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isTeacher = computed(() => !!user.value?.isTeacher)

  function syncTokenFromBackend() {
    token.value = Backend.userTokenResult?.token ?? null
  }

  async function login(loginName: string, pass: string) {
    try {
      const result: TokenResult = await Backend.userLogin(loginName, pass)
      if (result?.token) {
        syncTokenFromBackend()
        await fetchCurrentUser()
        return true
      }
    } catch (error) {
      console.error('Błąd logowania', error)
      return false
    }
    return false
  }

  function logout() {
    token.value = null
    user.value = null
    Backend.userTokenResult = undefined
    window.sessionStorage.removeItem('attend-me:userAuthData')
  }

  async function fetchCurrentUser() {
    syncTokenFromBackend()
    if (!token.value) return

    try {
      const userData = await Backend.userGet(undefined)
      user.value = userData
    } catch (error) {
      console.error('Nie udało się pobrać danych o użytkowniku', error)
      logout()
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isTeacher,
    login,
    logout,
    fetchCurrentUser,
  }
})
