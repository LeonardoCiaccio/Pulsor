<template>
  <div class="p-8 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-indigo-800 mb-4">⚡ Real-time Updates</h1>
      <p class="text-lg text-indigo-600 mb-6">
        Experience Pulsor's real-time capabilities with live data streams, automatic updates, and reactive UI components.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Real-time Controls -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🎛️ Real-time Controls</h2>
        
        <div class="space-y-4">
          <!-- Stream Controls -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Data Streams</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="toggleStream('metrics')"
                class="px-3 py-2 rounded text-sm transition-colors"
                :class="streams.metrics.active ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              >
                {{ streams.metrics.active ? 'Stop' : 'Start' }} Metrics
              </button>
              <button 
                @click="toggleStream('notifications')"
                class="px-3 py-2 rounded text-sm transition-colors"
                :class="streams.notifications.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              >
                {{ streams.notifications.active ? 'Stop' : 'Start' }} Notifications
              </button>
              <button 
                @click="toggleStream('chat')"
                class="px-3 py-2 rounded text-sm transition-colors"
                :class="streams.chat.active ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              >
                {{ streams.chat.active ? 'Stop' : 'Start' }} Chat
              </button>
              <button 
                @click="toggleStream('status')"
                class="px-3 py-2 rounded text-sm transition-colors"
                :class="streams.status.active ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              >
                {{ streams.status.active ? 'Stop' : 'Start' }} Status
              </button>
            </div>
          </div>

          <!-- Update Frequency -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Update Frequency</h3>
            <div class="space-y-2">
              <label class="block">
                <span class="text-sm text-gray-600">Metrics: {{ updateIntervals.metrics }}ms</span>
                <input 
                  v-model="updateIntervals.metrics" 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="100"
                  class="w-full mt-1"
                  @change="updateStreamInterval('metrics')"
                >
              </label>
              <label class="block">
                <span class="text-sm text-gray-600">Notifications: {{ updateIntervals.notifications }}ms</span>
                <input 
                  v-model="updateIntervals.notifications" 
                  type="range" 
                  min="500" 
                  max="10000" 
                  step="500"
                  class="w-full mt-1"
                  @change="updateStreamInterval('notifications')"
                >
              </label>
            </div>
          </div>

          <!-- Manual Triggers -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Manual Triggers</h3>
            <div class="space-y-2">
              <button 
                @click="triggerAlert"
                class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Trigger Alert
              </button>
              <button 
                @click="simulateUserJoin"
                class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Simulate User Join
              </button>
              <button 
                @click="broadcastMessage"
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Broadcast Message
              </button>
            </div>
          </div>

          <!-- Stream Statistics -->
          <div class="p-4 bg-indigo-50 rounded-lg">
            <h4 class="font-semibold text-indigo-800 mb-2">Stream Statistics</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-indigo-700">Active Streams:</span>
                <span class="font-semibold ml-1">{{ activeStreamCount }}</span>
              </div>
              <div>
                <span class="text-indigo-700">Total Updates:</span>
                <span class="font-semibold ml-1">{{ totalUpdates }}</span>
              </div>
              <div>
                <span class="text-indigo-700">Updates/sec:</span>
                <span class="font-semibold ml-1">{{ updatesPerSecond }}</span>
              </div>
              <div>
                <span class="text-indigo-700">Uptime:</span>
                <span class="font-semibold ml-1">{{ formatUptime(uptime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Data Display -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 Live Data Display</h2>
        
        <div class="space-y-4">
          <!-- Real-time Metrics -->
          <div v-if="streams.metrics.active" class="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h3 class="font-semibold text-green-800 mb-2">System Metrics</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-green-700">CPU Usage</div>
                <div class="font-bold text-lg text-green-800">{{ metrics.cpu }}%</div>
                <div class="w-full bg-green-200 rounded-full h-2 mt-1">
                  <div class="bg-green-600 h-2 rounded-full transition-all duration-300" :style="{ width: metrics.cpu + '%' }"></div>
                </div>
              </div>
              <div>
                <div class="text-green-700">Memory Usage</div>
                <div class="font-bold text-lg text-green-800">{{ metrics.memory }}%</div>
                <div class="w-full bg-green-200 rounded-full h-2 mt-1">
                  <div class="bg-green-600 h-2 rounded-full transition-all duration-300" :style="{ width: metrics.memory + '%' }"></div>
                </div>
              </div>
              <div>
                <div class="text-green-700">Network I/O</div>
                <div class="font-bold text-lg text-green-800">{{ metrics.network }} MB/s</div>
              </div>
              <div>
                <div class="text-green-700">Active Users</div>
                <div class="font-bold text-lg text-green-800">{{ metrics.users }}</div>
              </div>
            </div>
          </div>

          <!-- Live Notifications -->
          <div v-if="streams.notifications.active" class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 class="font-semibold text-blue-800 mb-2">Live Notifications</h3>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <div v-for="notification in recentNotifications" :key="notification.id" 
                   class="text-xs p-2 bg-white rounded border-l-2" 
                   :class="getNotificationClass(notification.type)">
                <div class="font-medium">{{ notification.message }}</div>
                <div class="text-gray-500">{{ notification.timestamp }}</div>
              </div>
            </div>
          </div>

          <!-- Live Chat -->
          <div v-if="streams.chat.active" class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <h3 class="font-semibold text-purple-800 mb-2">Live Chat</h3>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <div v-for="message in recentMessages" :key="message.id" 
                   class="text-xs p-2 bg-white rounded">
                <div class="font-medium text-purple-800">{{ message.user }}</div>
                <div class="text-gray-700">{{ message.text }}</div>
                <div class="text-gray-500">{{ message.timestamp }}</div>
              </div>
            </div>
          </div>

          <!-- System Status -->
          <div v-if="streams.status.active" class="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
            <h3 class="font-semibold text-orange-800 mb-2">System Status</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="systemStatus.api ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>API Server</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="systemStatus.database ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>Database</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="systemStatus.cache ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>Cache</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="systemStatus.queue ? 'bg-green-500' : 'bg-red-500'"></div>
                <span>Message Queue</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-orange-700">
              Last updated: {{ systemStatus.lastUpdate }}
            </div>
          </div>

          <!-- Connection Status -->
          <div class="p-3 rounded-lg" :class="isConnected ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'">
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full mr-2" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
              <span class="text-sm font-medium" :class="isConnected ? 'text-green-800' : 'text-red-800'">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </span>
              <span class="text-xs ml-2" :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ connectionLatency }}ms latency
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">Real-time Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create real-time data streams
const metricsStream = CreatePulser('stream:metrics', (data) => {
  // Process and emit metrics data
  return {
    timestamp: Date.now(),
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    network: Math.random() * 10,
    users: Math.floor(Math.random() * 1000)
  }
})

const notificationStream = CreatePulser('stream:notifications', (notification) => {
  // Handle real-time notifications
  return {
    id: generateId(),
    message: notification.message,
    type: notification.type,
    timestamp: new Date().toLocaleTimeString()
  }
})

// Set up real-time intervals
const startMetricsStream = () => {
  return setInterval(() => {
    const metrics = metricsStream.pulse()
    updateUI(metrics)
  }, 1000)
}

const startNotificationStream = () => {
  return setInterval(() => {
    const notification = generateRandomNotification()
    notificationStream.pulse(notification)
  }, 3000)
}

// Bind real-time listeners
metricsStream.bind((metrics) => {
  updateMetricsDisplay(metrics)
  logMetrics(metrics)
  checkThresholds(metrics)
})

notificationStream.bind((notification) => {
  showNotification(notification)
  updateNotificationCount()
  logActivity(notification)
})

// Real-time event handling
const handleRealTimeEvent = CreatePulser('realtime:event', (eventType, data) => {
  switch (eventType) {
    case 'user:join':
      updateUserCount(data.userId)
      broadcastUserJoin(data)
      break
    case 'system:alert':
      showAlert(data.message, data.severity)
      logAlert(data)
      break
    case 'data:update':
      refreshData(data.table)
      notifySubscribers(data)
      break
  }
})

// WebSocket-like real-time communication
const realTimeConnection = CreatePulser('connection:realtime', (message) => {
  // Simulate WebSocket message handling
  const parsedMessage = JSON.parse(message)
  handleRealTimeEvent.pulse(parsedMessage.type, parsedMessage.data)
})</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Live Data Streams</h3>
        <p class="text-gray-600 text-sm">Continuous data updates with configurable intervals and automatic UI synchronization.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Instant Updates</h3>
        <p class="text-gray-600 text-sm">Zero-latency event propagation for immediate UI updates and user feedback.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">📡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Event Broadcasting</h3>
        <p class="text-gray-600 text-sm">Broadcast events to multiple subscribers for coordinated real-time updates.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-indigo-600 text-2xl mb-3">🎛️</div>
        <h3 class="font-semibold text-gray-800 mb-2">Dynamic Control</h3>
        <p class="text-gray-600 text-sm">Start, stop, and configure real-time streams dynamically without application restart.</p>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Real-time Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No real-time activity yet. Start some streams above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const isConnected = ref(true)
const connectionLatency = ref(45)
const totalUpdates = ref(0)
const uptime = ref(0)
const recentNotifications = ref([])
const recentMessages = ref([])
const activityLog = ref([])

// Stream configuration
const streams = reactive({
  metrics: { active: false, interval: null },
  notifications: { active: false, interval: null },
  chat: { active: false, interval: null },
  status: { active: false, interval: null }
})

const updateIntervals = reactive({
  metrics: 1000,
  notifications: 3000,
  chat: 2000,
  status: 5000
})

// Live data
const metrics = reactive({
  cpu: 45,
  memory: 62,
  network: 2.3,
  users: 127
})

const systemStatus = reactive({
  api: true,
  database: true,
  cache: true,
  queue: false,
  lastUpdate: new Date().toLocaleTimeString()
})

// Computed properties
const activeStreamCount = computed(() => {
  return Object.values(streams).filter(stream => stream.active).length
})

const updatesPerSecond = computed(() => {
  if (uptime.value === 0) return 0
  return Math.round((totalUpdates.value / uptime.value) * 10) / 10
})

// Interval references
let uptimeInterval = null
let connectionCheckInterval = null

// Setup real-time system
const setupRealTimeSystem = () => {
  // Create real-time pulsers
  CreatePulser('stream:metrics', () => {
    const newMetrics = {
      cpu: Math.max(0, Math.min(100, metrics.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(0, Math.min(100, metrics.memory + (Math.random() - 0.5) * 8)),
      network: Math.max(0, metrics.network + (Math.random() - 0.5) * 2),
      users: Math.max(0, metrics.users + Math.floor((Math.random() - 0.5) * 20))
    }
    
    Object.assign(metrics, newMetrics)
    totalUpdates.value++
    logActivity('Metrics updated', 'metrics')
    
    return newMetrics
  })
  
  CreatePulser('stream:notifications', (notification) => {
    const newNotification = {
      id: generateId(),
      message: notification?.message || generateRandomNotification(),
      type: notification?.type || ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toLocaleTimeString()
    }
    
    recentNotifications.value.unshift(newNotification)
    if (recentNotifications.value.length > 10) {
      recentNotifications.value = recentNotifications.value.slice(0, 10)
    }
    
    totalUpdates.value++
    logActivity(`New notification: ${newNotification.message}`, 'notification')
    
    return newNotification
  })
  
  CreatePulser('stream:chat', (message) => {
    const newMessage = {
      id: generateId(),
      user: message?.user || generateRandomUser(),
      text: message?.text || generateRandomMessage(),
      timestamp: new Date().toLocaleTimeString()
    }
    
    recentMessages.value.unshift(newMessage)
    if (recentMessages.value.length > 8) {
      recentMessages.value = recentMessages.value.slice(0, 8)
    }
    
    totalUpdates.value++
    logActivity(`Chat message from ${newMessage.user}`, 'chat')
    
    return newMessage
  })
  
  CreatePulser('stream:status', () => {
    // Randomly update system status
    const services = ['api', 'database', 'cache', 'queue']
    const randomService = services[Math.floor(Math.random() * services.length)]
    
    if (Math.random() > 0.9) {
      systemStatus[randomService] = !systemStatus[randomService]
      logActivity(`${randomService} status changed to ${systemStatus[randomService] ? 'online' : 'offline'}`, 'status')
    }
    
    systemStatus.lastUpdate = new Date().toLocaleTimeString()
    totalUpdates.value++
    
    return systemStatus
  })
  
  CreatePulser('realtime:event', (eventType, data) => {
    logActivity(`Real-time event: ${eventType}`, 'event')
    totalUpdates.value++
    return { eventType, data, timestamp: Date.now() }
  })
  
  // Start uptime counter
  uptimeInterval = setInterval(() => {
    uptime.value++
  }, 1000)
  
  // Simulate connection checks
  connectionCheckInterval = setInterval(() => {
    connectionLatency.value = Math.floor(Math.random() * 100) + 20
    if (Math.random() > 0.95) {
      isConnected.value = !isConnected.value
      logActivity(`Connection ${isConnected.value ? 'restored' : 'lost'}`, 'connection')
    }
  }, 2000)
}

// Stream management functions
const toggleStream = (streamType) => {
  const stream = streams[streamType]
  
  if (stream.active) {
    stopStream(streamType)
  } else {
    startStream(streamType)
  }
}

const startStream = (streamType) => {
  const stream = streams[streamType]
  const interval = updateIntervals[streamType]
  
  if (!stream.active) {
    stream.interval = setInterval(() => {
      Pulsor(`stream:${streamType}`).pulse()
    }, interval)
    
    stream.active = true
    logActivity(`Started ${streamType} stream (${interval}ms interval)`, 'system')
  }
}

const stopStream = (streamType) => {
  const stream = streams[streamType]
  
  if (stream.active && stream.interval) {
    clearInterval(stream.interval)
    stream.interval = null
    stream.active = false
    logActivity(`Stopped ${streamType} stream`, 'system')
  }
}

const updateStreamInterval = (streamType) => {
  if (streams[streamType].active) {
    stopStream(streamType)
    startStream(streamType)
  }
}

// Manual trigger functions
const triggerAlert = () => {
  const alerts = [
    'System overload detected',
    'Security breach attempt',
    'Database connection timeout',
    'High memory usage warning',
    'Disk space running low'
  ]
  
  const randomAlert = alerts[Math.floor(Math.random() * alerts.length)]
  Pulsor('stream:notifications').pulse({
    message: randomAlert,
    type: 'error'
  })
  
  Pulsor('realtime:event').pulse('system:alert', {
    message: randomAlert,
    severity: 'high',
    timestamp: Date.now()
  })
}

const simulateUserJoin = () => {
  const user = generateRandomUser()
  
  Pulsor('stream:chat').pulse({
    user: user,
    text: `${user} joined the chat`
  })
  
  Pulsor('stream:notifications').pulse({
    message: `${user} joined the system`,
    type: 'success'
  })
  
  Pulsor('realtime:event').pulse('user:join', {
    userId: generateId(),
    username: user,
    timestamp: Date.now()
  })
}

const broadcastMessage = () => {
  const messages = [
    'System maintenance scheduled for tonight',
    'New features available in the dashboard',
    'Performance improvements deployed',
    'Security update completed successfully'
  ]
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  
  Pulsor('stream:notifications').pulse({
    message: randomMessage,
    type: 'info'
  })
  
  Pulsor('stream:chat').pulse({
    user: 'System',
    text: randomMessage
  })
  
  Pulsor('realtime:event').pulse('system:broadcast', {
    message: randomMessage,
    priority: 'normal',
    timestamp: Date.now()
  })
}

// Utility functions
const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

const generateRandomUser = () => {
  const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
  return users[Math.floor(Math.random() * users.length)]
}

const generateRandomMessage = () => {
  const messages = [
    'Hello everyone!',
    'How is everyone doing?',
    'Great work on the project!',
    'Anyone available for a quick call?',
    'Thanks for the help earlier',
    'Looking forward to the meeting',
    'Have a great day!',
    'The new feature looks amazing'
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

const generateRandomNotification = () => {
  const notifications = [
    'New message received',
    'Task completed successfully',
    'File upload finished',
    'Backup process started',
    'User logged in',
    'Data sync completed',
    'Report generated',
    'System health check passed'
  ]
  return notifications[Math.floor(Math.random() * notifications.length)]
}

const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const logActivity = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  activityLog.value.unshift({
    message: `[${timestamp}] ${message}`,
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 30 entries
  if (activityLog.value.length > 30) {
    activityLog.value = activityLog.value.slice(0, 30)
  }
}

const getNotificationClass = (type) => {
  switch (type) {
    case 'error': return 'border-red-400'
    case 'warning': return 'border-orange-400'
    case 'success': return 'border-green-400'
    case 'info': return 'border-blue-400'
    default: return 'border-gray-400'
  }
}

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'warning': return 'text-orange-600'
    case 'success': return 'text-green-600'
    case 'metrics': return 'text-blue-600'
    case 'notification': return 'text-purple-600'
    case 'chat': return 'text-indigo-600'
    case 'status': return 'text-orange-600'
    case 'event': return 'text-red-600'
    case 'connection': return 'text-yellow-600'
    case 'system': return 'text-gray-800 font-semibold'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupRealTimeSystem()
  logActivity('Real-time Updates demo initialized', 'system')
})

onUnmounted(() => {
  // Clean up intervals
  Object.values(streams).forEach(stream => {
    if (stream.interval) {
      clearInterval(stream.interval)
    }
  })
  
  if (uptimeInterval) {
    clearInterval(uptimeInterval)
  }
  
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
  }
  
  logActivity('Real-time Updates demo unmounted', 'system')
})
</script>