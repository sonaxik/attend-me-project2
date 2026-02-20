import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TeacherView from '@/views/TeacherView.vue'
import StudentView from '@/views/StudentView.vue'
import StudentCourseDetailsView from '@/views/StudentCourseDetailsView.vue'
import TeacherSessionView from '@/views/TeacherSessionView.vue'
import StudentDeviceRegisterView from '@/views/StudentDeviceRegisterView.vue'
import StudentQRView from '@/views/StudentQRView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/TeacherView',
      name: 'teacher',
      component: TeacherView,
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/StudentView',
      name: 'student',
      component: StudentView,
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/student/course/:id',
      name: 'student-course-details',
      component: StudentCourseDetailsView,
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/teacher/session/:id',
      name: 'teacher-session-details',
      component: TeacherSessionView,
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/student/device-register',
      name: 'student-device-register',
      component: StudentDeviceRegisterView,
    },
    {
      path: '/student/qr',
      name: 'student-qr',
      component: StudentQRView,
      meta: { requiresAuth: true, role: 'student' },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.user && authStore.token) {
    await authStore.fetchCurrentUser()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isTeacher = authStore.isTeacher
  
  const publicPages = ['login', 'student-device-register']
  const authRequired = !publicPages.includes(to.name as string)

  if (!isAuthenticated && authRequired) {
    return next({ name: 'login' })
  } 

  if (!authRequired && isAuthenticated && to.name === 'login') {
    return next(isTeacher ? { name: 'teacher' } : { name: 'student' })
  } 

  if (isAuthenticated && authRequired && to.meta.role) {
    if (to.meta.role === 'teacher' && !isTeacher) {
      return next({ name: 'student' })
    }
    
    if (to.meta.role === 'student' && isTeacher) {
      return next({ name: 'teacher' })
    }
  }

  next()
})

export default router