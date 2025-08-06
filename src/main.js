import { createApp } from 'vue'
import App from '@/App.vue'
import '@/css/styles.css'
import PulsorPlugin from '@/plugins/pulsor/plugin.js'

createApp(App).use(PulsorPlugin).mount('#app')
