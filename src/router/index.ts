import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TeacherView from '@/views/TeacherView.vue'
import StudentView from '@/views/StudentView.vue'

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
    }

  ],
})

export default router
