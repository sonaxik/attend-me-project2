import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { AttendMeBackendClient } from './backend/AttendMeBackendClient'

const app = createApp(App)

const SERVER_API_URL = 'https://attendme-backend.runasp.net';

export const backend = new AttendMeBackendClient(SERVER_API_URL);

const savedDeviceToken = localStorage.getItem('device_token');
if(savedDeviceToken)
{
    console.log("Przywrócono token urządzenia z pamięci");
    (backend as any).token = savedDeviceToken;
}

app.use(createPinia())
app.use(router)

app.mount('#app')

export { backend as Backend }
