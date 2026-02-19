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
      redirect: '/login'
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
    },
        {
      path: '/StudentView',
      name: 'student',
      component: StudentView,
    },
        {
      path: '/student/course/:id',
      name: 'student-course-details',
      component: StudentCourseDetailsView,
      meta: {requiresAuth: true}
      },
      {
      path: '/teacher/session/:id',
      name: 'teacher-session-details',
      component: TeacherSessionView,
      meta: { requiresAuth: true } // ?? meta, to na pewno git?
    },
    {
      path: '/student/device-register',
      name: 'student-device-register',
      component: StudentDeviceRegisterView
    },
    {
      path: '/student/qr',
      name: 'student-qr',
      component: StudentQRView,
      meta: {requiresAuth: true}
    }


  ],
})

router.beforeEach((to, from, next)=>
{
  const authStore = useAuthStore()
  const isAuthenticated = !!authStore.user
  const publicPages = ['login', 'student-device-register']
  const authRequired = !publicPages.includes(to.name as string)
  if(!isAuthenticated && authRequired)
  {
    next({name: 'login'})
  }
  else if (!authRequired && isAuthenticated && to.name === 'login')
  {
    next('/')
  }
  else
  {
    next()
  }
})

export default router
