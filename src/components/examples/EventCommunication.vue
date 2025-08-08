<template>
  <div class="p-8 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-800 mb-4">📡 Event Communication</h1>
      <p class="text-lg text-blue-600 mb-6">
        Explore Pulsor's event-driven communication system for building reactive applications with decoupled components.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Event Publisher -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📤 Event Publisher</h2>
        
        <div class="space-y-4">
          <!-- User Events -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">User Events</h3>
            <div class="space-y-2">
              <input 
                v-model="userName" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              >
              <div class="flex space-x-2">
                <button 
                  @click="publishUserLogin"
                  class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  User Login
                </button>
                <button 
                  @click="publishUserLogout"
                  class="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  User Logout
                </button>
              </div>
            </div>
          </div>

          <!-- System Events -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">System Events</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="publishSystemAlert"
                class="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                System Alert
              </button>
              <button 
                @click="publishDataUpdate"
                class="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
              >
                Data Update
              </button>
              <button 
                @click="publishNotification"
                class="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                Notification
              </button>
              <button 
                @click="publishBroadcast"
                class="bg-pink-600 text-white px-3 py-2 rounded text-sm hover:bg-pink-700 transition-colors"
              >
                Broadcast
              </button>
            </div>
          </div>

          <!-- Custom Event -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Custom Event</h3>
            <div class="space-y-2">
              <input 
                v-model="customEventType" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event type (e.g., order:created)"
              >
              <textarea 
                v-model="customEventData" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Event data (JSON format)"
              ></textarea>
              <button 
                @click="publishCustomEvent"
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Publish Custom Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Subscribers -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📥 Event Subscribers</h2>
        
        <div class="space-y-4">
          <!-- Active Listeners -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">Active Listeners</h3>
            <div class="space-y-2">
              <div v-for="listener in activeListeners" :key="listener.id" 
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="font-medium text-gray-800">{{ listener.name }}</div>
                  <div class="text-sm text-gray-600">{{ listener.event }}</div>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {{ listener.count }} events
                  </span>
                  <button 
                    @click="toggleListener(listener.id)"
                    class="text-xs px-2 py-1 rounded transition-colors"
                    :class="listener.active ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'"
                  >
                    {{ listener.active ? 'Disable' : 'Enable' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Statistics -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Event Statistics</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ totalEventsPublished }}</div>
                <div class="text-sm text-blue-800">Events Published</div>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ totalEventsReceived }}</div>
                <div class="text-sm text-green-800">Events Received</div>
              </div>
            </div>
          </div>

          <!-- Recent Events -->
          <div class="border-t pt-4">
            <h3 class="font-semibold text-gray-700 mb-3">Recent Events</h3>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div v-for="event in recentEvents" :key="event.id" 
                   class="text-xs p-2 bg-gray-50 rounded border-l-2" 
                   :class="getEventBorderClass(event.type)">
                <div class="font-medium">{{ event.type }}</div>
                <div class="text-gray-600">{{ event.timestamp }}</div>
                <div v-if="event.data" class="text-gray-500 mt-1">{{ formatEventData(event.data) }}</div>
              </div>
              <div v-if="recentEvents.length === 0" class="text-gray-400 text-sm italic text-center py-4">
                No events received yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">Event Communication Code</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create event publishers
const userEvents = CreatePulser('user:events', (eventType, data) => {
  console.log(`User event: ${eventType}`, data)
  return { type: eventType, data, timestamp: Date.now() }
})

const systemEvents = CreatePulser('system:events', (eventType, data) => {
  console.log(`System event: ${eventType}`, data)
  return { type: eventType, data, timestamp: Date.now() }
})

// Subscribe to events
userEvents.bind((eventType, data) => {
  if (eventType === 'login') {
    updateUserStatus(data.username, 'online')
    logActivity(`User ${data.username} logged in`)
  }
})

systemEvents.bind((eventType, data) => {
  if (eventType === 'alert') {
    showNotification(data.message, 'warning')
  }
})

// Publish events
userEvents.pulse('login', { username: 'john_doe', timestamp: Date.now() })
systemEvents.pulse('alert', { message: 'System maintenance in 5 minutes' })

// Cross-component communication
const notificationSystem = CreatePulser('notifications', (message, type) => {
  return { id: generateId(), message, type, timestamp: Date.now() }
})

// Multiple subscribers for the same event
notificationSystem.binds([
  (message, type) => updateUI(message, type),
  (message, type) => logNotification(message, type),
  (message, type) => sendToAnalytics(message, type)
])</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-blue-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Decoupled Communication</h3>
        <p class="text-gray-600 text-sm">Components communicate without direct dependencies, improving maintainability.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-blue-600 text-2xl mb-3">📢</div>
        <h3 class="font-semibold text-gray-800 mb-2">Event Broadcasting</h3>
        <p class="text-gray-600 text-sm">One event can trigger multiple subscribers, enabling powerful reactive patterns.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-blue-600 text-2xl mb-3">🎯</div>
        <h3 class="font-semibold text-gray-800 mb-2">Targeted Events</h3>
        <p class="text-gray-600 text-sm">Use namespaced events for organized and targeted communication patterns.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-blue-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Real-time Updates</h3>
        <p class="text-gray-600 text-sm">Instant event propagation enables real-time application updates and responses.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const userName = ref('john_doe')
const customEventType = ref('order:created')
const customEventData = ref('{"orderId": 12345, "amount": 99.99}')
const totalEventsPublished = ref(0)
const totalEventsReceived = ref(0)
const recentEvents = ref([])

// Active listeners configuration
const activeListeners = reactive([
  { id: 'user-logger', name: 'User Logger', event: 'user:*', active: true, count: 0 },
  { id: 'system-monitor', name: 'System Monitor', event: 'system:*', active: true, count: 0 },
  { id: 'notification-handler', name: 'Notification Handler', event: 'notification:*', active: true, count: 0 },
  { id: 'analytics-tracker', name: 'Analytics Tracker', event: '*', active: true, count: 0 }
])

// Event listener references
let eventListeners = {}

// Setup event communication system
const setupEventSystem = () => {
  // Create event publishers
  CreatePulser('user:events', (eventType, data) => {
    const event = {
      id: generateEventId(),
      type: `user:${eventType}`,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    addRecentEvent(event)
    totalEventsPublished.value++
    return event
  })
  
  CreatePulser('system:events', (eventType, data) => {
    const event = {
      id: generateEventId(),
      type: `system:${eventType}`,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    addRecentEvent(event)
    totalEventsPublished.value++
    return event
  })
  
  CreatePulser('notification:events', (eventType, data) => {
    const event = {
      id: generateEventId(),
      type: `notification:${eventType}`,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    addRecentEvent(event)
    totalEventsPublished.value++
    return event
  })
  
  CreatePulser('custom:events', (eventType, data) => {
    const event = {
      id: generateEventId(),
      type: eventType,
      data,
      timestamp: new Date().toLocaleTimeString()
    }
    addRecentEvent(event)
    totalEventsPublished.value++
    return event
  })
  
  // Setup event listeners
  setupEventListeners()
}

// Setup event listeners
const setupEventListeners = () => {
  // User events listener
  eventListeners['user-logger'] = (eventType, data) => {
    if (activeListeners.find(l => l.id === 'user-logger')?.active) {
      console.log(`[User Logger] ${eventType}:`, data)
      incrementListenerCount('user-logger')
      totalEventsReceived.value++
    }
  }
  
  // System events listener
  eventListeners['system-monitor'] = (eventType, data) => {
    if (activeListeners.find(l => l.id === 'system-monitor')?.active) {
      console.log(`[System Monitor] ${eventType}:`, data)
      incrementListenerCount('system-monitor')
      totalEventsReceived.value++
    }
  }
  
  // Notification handler
  eventListeners['notification-handler'] = (eventType, data) => {
    if (activeListeners.find(l => l.id === 'notification-handler')?.active) {
      console.log(`[Notification Handler] ${eventType}:`, data)
      incrementListenerCount('notification-handler')
      totalEventsReceived.value++
    }
  }
  
  // Analytics tracker (listens to all events)
  eventListeners['analytics-tracker'] = (eventType, data) => {
    if (activeListeners.find(l => l.id === 'analytics-tracker')?.active) {
      console.log(`[Analytics] Event tracked: ${eventType}`)
      incrementListenerCount('analytics-tracker')
      totalEventsReceived.value++
    }
  }
  
  // Bind listeners to pulsers
  Pulsor('user:events').bind(eventListeners['user-logger'])
  Pulsor('system:events').bind(eventListeners['system-monitor'])
  Pulsor('notification:events').bind(eventListeners['notification-handler'])
  
  // Bind analytics to all event types
  Pulsor('user:events').bind(eventListeners['analytics-tracker'])
  Pulsor('system:events').bind(eventListeners['analytics-tracker'])
  Pulsor('notification:events').bind(eventListeners['analytics-tracker'])
  Pulsor('custom:events').bind(eventListeners['analytics-tracker'])
}

// Event publishing functions
const publishUserLogin = () => {
  Pulsor('user:events').pulse('login', {
    username: userName.value,
    timestamp: Date.now(),
    sessionId: generateSessionId()
  })
}

const publishUserLogout = () => {
  Pulsor('user:events').pulse('logout', {
    username: userName.value,
    timestamp: Date.now(),
    duration: Math.floor(Math.random() * 3600) // Random session duration
  })
}

const publishSystemAlert = () => {
  const alerts = [
    'System maintenance scheduled',
    'High CPU usage detected',
    'Database connection restored',
    'Security scan completed'
  ]
  const randomAlert = alerts[Math.floor(Math.random() * alerts.length)]
  
  Pulsor('system:events').pulse('alert', {
    message: randomAlert,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    timestamp: Date.now()
  })
}

const publishDataUpdate = () => {
  Pulsor('system:events').pulse('data_update', {
    table: ['users', 'orders', 'products'][Math.floor(Math.random() * 3)],
    operation: ['insert', 'update', 'delete'][Math.floor(Math.random() * 3)],
    recordCount: Math.floor(Math.random() * 100) + 1,
    timestamp: Date.now()
  })
}

const publishNotification = () => {
  const notifications = [
    'New message received',
    'Task completed successfully',
    'Reminder: Meeting in 15 minutes',
    'File upload finished'
  ]
  const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
  
  Pulsor('notification:events').pulse('show', {
    message: randomNotification,
    type: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)],
    timestamp: Date.now()
  })
}

const publishBroadcast = () => {
  const broadcasts = [
    'Server restart in 5 minutes',
    'New feature available',
    'Scheduled maintenance window',
    'System performance optimized'
  ]
  const randomBroadcast = broadcasts[Math.floor(Math.random() * broadcasts.length)]
  
  Pulsor('system:events').pulse('broadcast', {
    message: randomBroadcast,
    priority: ['normal', 'high', 'urgent'][Math.floor(Math.random() * 3)],
    timestamp: Date.now()
  })
}

const publishCustomEvent = () => {
  try {
    const data = customEventData.value ? JSON.parse(customEventData.value) : {}
    Pulsor('custom:events').pulse(customEventType.value, data)
  } catch (error) {
    console.error('Invalid JSON data:', error)
    Pulsor('custom:events').pulse(customEventType.value, { raw: customEventData.value })
  }
}

// Listener management
const toggleListener = (listenerId) => {
  const listener = activeListeners.find(l => l.id === listenerId)
  if (listener) {
    listener.active = !listener.active
    console.log(`${listener.name} ${listener.active ? 'enabled' : 'disabled'}`)
  }
}

const incrementListenerCount = (listenerId) => {
  const listener = activeListeners.find(l => l.id === listenerId)
  if (listener) {
    listener.count++
  }
}

// Utility functions
const generateEventId = () => {
  return Math.random().toString(36).substr(2, 9)
}

const generateSessionId = () => {
  return Math.random().toString(36).substr(2, 16)
}

const addRecentEvent = (event) => {
  recentEvents.value.unshift(event)
  if (recentEvents.value.length > 10) {
    recentEvents.value = recentEvents.value.slice(0, 10)
  }
}

const formatEventData = (data) => {
  if (typeof data === 'object') {
    return JSON.stringify(data).substring(0, 50) + (JSON.stringify(data).length > 50 ? '...' : '')
  }
  return String(data).substring(0, 50)
}

const getEventBorderClass = (eventType) => {
  if (eventType.startsWith('user:')) return 'border-green-400'
  if (eventType.startsWith('system:')) return 'border-orange-400'
  if (eventType.startsWith('notification:')) return 'border-indigo-400'
  return 'border-blue-400'
}

// Lifecycle hooks
onMounted(() => {
  setupEventSystem()
  console.log('Event Communication demo initialized')
})

onUnmounted(() => {
  console.log('Event Communication demo unmounted')
})
</script>