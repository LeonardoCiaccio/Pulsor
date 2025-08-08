<template>
  <div class="p-8 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-emerald-800 mb-4">🚀 Async Operations</h1>
      <p class="text-lg text-emerald-600 mb-6">
        Explore Pulsor's powerful asynchronous capabilities with real-world examples like API calls, delays, and parallel processing.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Interactive Demo -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Async Demo</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Delay (milliseconds):</label>
            <input 
              v-model.number="delayMs" 
              type="number" 
              min="100" 
              max="5000"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter delay in ms"
            >
          </div>

          <div class="flex space-x-2">
            <button 
              @click="performDelay"
              :disabled="isLoading"
              class="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Processing...' : 'Async Delay' }}
            </button>
            <button 
              @click="fetchUserData"
              :disabled="isLoading"
              class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Fetching...' : 'Fetch User' }}
            </button>
          </div>

          <button 
            @click="runParallelOperations"
            :disabled="isLoading"
            class="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Running...' : 'Parallel Operations' }}
          </button>

          <!-- Progress Bar -->
          <div v-if="isLoading" class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-emerald-600 h-2 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
          </div>

          <!-- Results -->
          <div v-if="lastResult" class="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
            <p class="text-emerald-800 font-semibold">Result:</p>
            <pre class="text-emerald-700 text-sm mt-2 whitespace-pre-wrap">{{ JSON.stringify(lastResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Code Example -->
      <div class="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-white mb-4">Async Implementation</h2>
        <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create async pulsers
CreatePulser('delay', async (ms) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(`Delayed ${ms}ms`), ms)
  })
}, { isAsync: true })

CreatePulser('fetchUser', async (id) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

// Use async pulsers
const result = await Pulsor('delay').pulse(1000)
const user = await Pulsor('fetchUser').pulse(123)

// Parallel execution
const [delay1, delay2] = await Promise.all([
  Pulsor('delay').pulse(500),
  Pulsor('delay').pulse(800)
])</code></pre>
      </div>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">⏱️</div>
        <h3 class="font-semibold text-gray-800 mb-2">Auto-Detection</h3>
        <p class="text-gray-600 text-sm">Pulsor automatically detects async functions and handles Promise resolution.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Promise Support</h3>
        <p class="text-gray-600 text-sm">Full Promise support with proper error handling and async callback execution.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">⚡</div>
        <h3 class="font-semibold text-gray-800 mb-2">Parallel Execution</h3>
        <p class="text-gray-600 text-sm">Run multiple async operations in parallel for optimal performance.</p>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Async Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" class="text-sm font-mono" :class="log.type === 'error' ? 'text-red-600' : 'text-gray-600'">
          {{ log.message }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No async operations performed yet. Try the demo above!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// Reactive data
const delayMs = ref(1000)
const isLoading = ref(false)
const progress = ref(0)
const lastResult = ref(null)
const activityLog = ref([])

// Mock user data for demonstration
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' }
]

// Setup async pulsers
const setupAsyncPulsers = () => {
  // Delay pulser with progress tracking
  CreatePulser('delay', async (ms) => {
    logActivity(`Starting delay of ${ms}ms`)
    
    return new Promise((resolve) => {
      let elapsed = 0
      const interval = setInterval(() => {
        elapsed += 50
        progress.value = Math.min((elapsed / ms) * 100, 100)
        
        if (elapsed >= ms) {
          clearInterval(interval)
          const result = `Delay completed: ${ms}ms`
          logActivity(result)
          resolve(result)
        }
      }, 50)
    })
  }, { isAsync: true })
  
  // Mock API fetch pulser
  CreatePulser('fetchUser', async (userId = null) => {
    logActivity(`Fetching user data...`)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const user = userId 
      ? mockUsers.find(u => u.id === userId) 
      : mockUsers[Math.floor(Math.random() * mockUsers.length)]
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }
    
    logActivity(`User fetched: ${user.name}`)
    return user
  }, { isAsync: true })
  
  // Parallel processing pulser
  CreatePulser('parallelProcess', async (tasks) => {
    logActivity(`Starting ${tasks.length} parallel tasks`)
    
    const results = await Promise.allSettled(tasks.map(async (task, index) => {
      await new Promise(resolve => setTimeout(resolve, task.delay))
      return { taskId: index + 1, result: task.operation(), delay: task.delay }
    }))
    
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value)
    const failed = results.filter(r => r.status === 'rejected').length
    
    logActivity(`Parallel processing completed: ${successful.length} successful, ${failed} failed`)
    return { successful, failedCount: failed }
  }, { isAsync: true })
}

// Perform delay operation
const performDelay = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  progress.value = 0
  
  try {
    const result = await Pulsor('delay').pulse(delayMs.value)
    lastResult.value = { operation: 'delay', result, timestamp: new Date().toISOString() }
  } catch (error) {
    logActivity(`Error in delay: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
    progress.value = 0
  }
}

// Fetch user data
const fetchUserData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const user = await Pulsor('fetchUser').pulse()
    lastResult.value = { operation: 'fetchUser', result: user, timestamp: new Date().toISOString() }
  } catch (error) {
    logActivity(`Error fetching user: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// Run parallel operations
const runParallelOperations = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const tasks = [
      { delay: 500, operation: () => Math.random() * 100 },
      { delay: 800, operation: () => 'Task completed' },
      { delay: 300, operation: () => new Date().getTime() },
      { delay: 1200, operation: () => 'Final result' }
    ]
    
    const result = await Pulsor('parallelProcess').pulse(tasks)
    lastResult.value = { operation: 'parallelProcess', result, timestamp: new Date().toISOString() }
  } catch (error) {
    logActivity(`Error in parallel processing: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// Log activity with timestamp
const logActivity = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  activityLog.value.unshift({ 
    message: `[${timestamp}] ${message}`, 
    type,
    timestamp: Date.now()
  })
  
  // Keep only last 15 entries
  if (activityLog.value.length > 15) {
    activityLog.value = activityLog.value.slice(0, 15)
  }
}

// Lifecycle hooks
onMounted(() => {
  setupAsyncPulsers()
  logActivity('Async Operations demo initialized')
})

onUnmounted(() => {
  logActivity('Async demo component unmounted')
})
</script>