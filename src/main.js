import { createApp } from 'vue'
import App from '@/App.vue'
import '@/css/styles.css'
import { initializePulsorEvents } from './pulsor.main.js'

const app = createApp(App);

// Initialize Pulsor events
initializePulsorEvents();

app.mount('#app');
