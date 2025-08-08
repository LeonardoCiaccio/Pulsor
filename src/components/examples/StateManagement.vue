<template>
  <div class="p-8 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-lg shadow-lg">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-emerald-800 mb-4">🗃️ State Management</h1>
      <p class="text-lg text-emerald-600 mb-6">
        Discover Pulsor's powerful state management capabilities with reactive stores, state persistence, time travel debugging, and cross-component communication.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- State Controls -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🎛️ State Operations</h2>
        
        <div class="space-y-6">
          <!-- User State Management -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">User State</h3>
            <div class="space-y-3">
              <div class="flex space-x-2">
                <input 
                  v-model="newUser.name" 
                  type="text" 
                  placeholder="User name"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                <input 
                  v-model="newUser.email" 
                  type="email" 
                  placeholder="User email"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
              </div>
              
              <div class="flex space-x-2">
                <button 
                  @click="addUser" 
                  class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Add User
                </button>
                
                <button 
                  @click="clearUsers" 
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Users
                </button>
                
                <button 
                  @click="loadSampleUsers" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Load Sample
                </button>
              </div>
            </div>
          </div>

          <!-- Counter State -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Counter State</h3>
            <div class="flex items-center space-x-4">
              <button 
                @click="decrementCounter" 
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                -
              </button>
              
              <div class="text-2xl font-bold text-emerald-600 min-w-[60px] text-center">
                {{ currentState.counter }}
              </div>
              
              <button 
                @click="incrementCounter" 
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                +
              </button>
              
              <button 
                @click="resetCounter" 
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Settings State -->
          <div class="border-b pb-4">
            <h3 class="font-semibold text-gray-700 mb-3">Settings State</h3>
            <div class="space-y-3">
              <label class="flex items-center">
                <input 
                  v-model="currentState.settings.darkMode" 
                  @change="updateSettings"
                  type="checkbox" 
                  class="mr-2 text-emerald-600 focus:ring-emerald-500"
                >
                <span class="text-sm">Dark Mode</span>
              </label>
              
              <label class="flex items-center">
                <input 
                  v-model="currentState.settings.notifications" 
                  @change="updateSettings"
                  type="checkbox" 
                  class="mr-2 text-emerald-600 focus:ring-emerald-500"
                >
                <span class="text-sm">Enable Notifications</span>
              </label>
              
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium">Theme:</label>
                <select 
                  v-model="currentState.settings.theme" 
                  @change="updateSettings"
                  class="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium">Language:</label>
                <select 
                  v-model="currentState.settings.language" 
                  @change="updateSettings"
                  class="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>

          <!-- State Persistence -->
          <div>
            <h3 class="font-semibold text-gray-700 mb-3">State Persistence</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="saveState" 
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Save State
              </button>
              
              <button 
                @click="loadState" 
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Load State
              </button>
              
              <button 
                @click="exportState" 
                class="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Export State
              </button>
              
              <button 
                @click="importState" 
                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Import State
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- State Display -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 Current State</h2>
        
        <div class="space-y-4">
          <!-- State Tabs -->
          <div class="flex space-x-2 border-b">
            <button 
              v-for="tab in stateTabs" 
              :key="tab.id"
              @click="activeStateTab = tab.id"
              class="px-3 py-2 text-sm font-medium transition-colors"
              :class="activeStateTab === tab.id ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-600 hover:text-gray-800'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- State Content -->
          <div class="max-h-96 overflow-y-auto">
            <!-- Users State -->
            <div v-if="activeStateTab === 'users'" class="space-y-3">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold text-gray-700">Users ({{ currentState.users.length }})</span>
                <span class="text-xs text-gray-500">Last updated: {{ formatTimestamp(currentState.lastUpdated) }}</span>
              </div>
              
              <div v-for="user in currentState.users" :key="user.id" 
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="font-medium text-gray-800">{{ user.name }}</div>
                  <div class="text-sm text-gray-600">{{ user.email }}</div>
                </div>
                
                <button 
                  @click="removeUser(user.id)" 
                  class="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
              
              <div v-if="currentState.users.length === 0" class="text-center py-8">
                <div class="text-gray-400 text-lg mb-2">👥</div>
                <div class="text-gray-500 text-sm">No users in state</div>
                <div class="text-gray-400 text-xs mt-1">Add some users to see them here</div>
              </div>
            </div>

            <!-- Settings State -->
            <div v-else-if="activeStateTab === 'settings'" class="space-y-3">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold text-gray-700">Application Settings</span>
                <span class="text-xs text-gray-500">Last updated: {{ formatTimestamp(currentState.lastUpdated) }}</span>
              </div>
              
              <div class="space-y-2">
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm font-medium">Dark Mode</span>
                  <span class="px-2 py-1 rounded-full text-xs" 
                        :class="currentState.settings.darkMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ currentState.settings.darkMode ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm font-medium">Notifications</span>
                  <span class="px-2 py-1 rounded-full text-xs" 
                        :class="currentState.settings.notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                    {{ currentState.settings.notifications ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm font-medium">Theme</span>
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {{ currentState.settings.theme }}
                  </span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm font-medium">Language</span>
                  <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {{ getLanguageName(currentState.settings.language) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Raw State -->
            <div v-else-if="activeStateTab === 'raw'" class="space-y-3">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold text-gray-700">Raw State Data</span>
                <button 
                  @click="copyStateToClipboard" 
                  class="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors text-xs"
                >
                  Copy JSON
                </button>
              </div>
              
              <div class="bg-gray-900 p-4 rounded-lg">
                <pre class="text-green-400 text-xs overflow-x-auto">{{ JSON.stringify(currentState, null, 2) }}</pre>
              </div>
            </div>

            <!-- State History -->
            <div v-else-if="activeStateTab === 'history'" class="space-y-3">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold text-gray-700">State History ({{ stateHistory.length }})</span>
                <button 
                  @click="clearHistory" 
                  class="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-xs"
                >
                  Clear History
                </button>
              </div>
              
              <div v-for="(historyItem, index) in stateHistory.slice(0, 10)" :key="historyItem.id" 
                   class="border border-gray-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm">{{ historyItem.action }}</span>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-500">{{ formatTimestamp(historyItem.timestamp) }}</span>
                    <button 
                      @click="revertToState(index)" 
                      class="px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-xs"
                    >
                      Revert
                    </button>
                  </div>
                </div>
                
                <div class="text-xs text-gray-600 mb-2">{{ historyItem.description }}</div>
                
                <div class="bg-gray-50 p-2 rounded text-xs">
                  <pre class="text-gray-700 whitespace-pre-wrap">{{ JSON.stringify(historyItem.changes, null, 2).substring(0, 200) }}{{ JSON.stringify(historyItem.changes, null, 2).length > 200 ? '...' : '' }}</pre>
                </div>
              </div>
              
              <div v-if="stateHistory.length === 0" class="text-center py-8">
                <div class="text-gray-400 text-lg mb-2">📜</div>
                <div class="text-gray-500 text-sm">No state history yet</div>
                <div class="text-gray-400 text-xs mt-1">Make some state changes to see history</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Example -->
    <div class="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-white mb-4">State Management Implementation</h2>
      <pre class="text-green-400 text-sm overflow-x-auto"><code>// Create reactive state store with Pulsor
const createStateStore = CreatePulser('state:store', (initialState = {}) => {
  const state = reactive({
    ...initialState,
    lastUpdated: Date.now()
  })
  
  const history = []
  const subscribers = new Set()
  
  return {
    state,
    history,
    subscribers,
    
    // Get current state
    getState: () => state,
    
    // Update state with history tracking
    setState: (updates, action = 'setState') => {
      const previousState = JSON.parse(JSON.stringify(state))
      
      Object.assign(state, updates, { lastUpdated: Date.now() })
      
      // Add to history
      history.unshift({
        id: Date.now(),
        action,
        timestamp: Date.now(),
        previousState,
        currentState: JSON.parse(JSON.stringify(state)),
        changes: updates
      })
      
      // Keep only last 50 history entries
      if (history.length > 50) {
        history.splice(50)
      }
      
      // Notify subscribers
      subscribers.forEach(callback => callback(state, action))
      
      return state
    },
    
    // Subscribe to state changes
    subscribe: (callback) => {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    
    // Revert to previous state
    revert: (historyIndex = 0) => {
      if (history[historyIndex]) {
        const targetState = history[historyIndex].previousState
        Object.assign(state, targetState, { lastUpdated: Date.now() })
        
        // Add revert action to history
        history.unshift({
          id: Date.now(),
          action: 'revert',
          timestamp: Date.now(),
          description: `Reverted to state from ${new Date(history[historyIndex].timestamp).toLocaleString()}`,
          changes: targetState
        })
        
        subscribers.forEach(callback => callback(state, 'revert'))
      }
    }
  }
})

// Initialize application state store
const appStore = createStateStore.pulse({
  users: [],
  counter: 0,
  settings: {
    darkMode: false,
    notifications: true,
    theme: 'light',
    language: 'en'
  }
})

// State mutation pulsers
const addUser = CreatePulser('state:users:add', (user) => {
  const newUser = {
    id: Date.now(),
    name: user.name,
    email: user.email,
    createdAt: Date.now()
  }
  
  const currentUsers = appStore.getState().users
  appStore.setState(
    { users: [...currentUsers, newUser] },
    'addUser'
  )
  
  return newUser
})

const removeUser = CreatePulser('state:users:remove', (userId) => {
  const currentUsers = appStore.getState().users
  const updatedUsers = currentUsers.filter(user => user.id !== userId)
  
  appStore.setState(
    { users: updatedUsers },
    'removeUser'
  )
  
  return userId
})

const updateCounter = CreatePulser('state:counter:update', (operation, value = 1) => {
  const currentCounter = appStore.getState().counter
  let newCounter
  
  switch (operation) {
    case 'increment':
      newCounter = currentCounter + value
      break
    case 'decrement':
      newCounter = currentCounter - value
      break
    case 'reset':
      newCounter = 0
      break
    case 'set':
      newCounter = value
      break
    default:
      newCounter = currentCounter
  }
  
  appStore.setState(
    { counter: newCounter },
    `counter:${operation}`
  )
  
  return newCounter
})

const updateSettings = CreatePulser('state:settings:update', (settingUpdates) => {
  const currentSettings = appStore.getState().settings
  const newSettings = { ...currentSettings, ...settingUpdates }
  
  appStore.setState(
    { settings: newSettings },
    'updateSettings'
  )
  
  return newSettings
})

// State persistence
const saveState = CreatePulser('state:save', (key = 'appState') => {
  const state = appStore.getState()
  const serializedState = JSON.stringify(state)
  
  localStorage.setItem(key, serializedState)
  
  return {
    success: true,
    key,
    size: serializedState.length,
    timestamp: Date.now()
  }
})

const loadState = CreatePulser('state:load', (key = 'appState') => {
  const serializedState = localStorage.getItem(key)
  
  if (!serializedState) {
    throw new Error(`No saved state found for key: ${key}`)
  }
  
  const savedState = JSON.parse(serializedState)
  appStore.setState(savedState, 'loadState')
  
  return {
    success: true,
    key,
    loadedAt: Date.now()
  }
})

// State synchronization across components
const syncStateAcrossComponents = CreatePulser('state:sync', () => {
  // Subscribe to state changes and broadcast to all components
  return appStore.subscribe((newState, action) => {
    // Emit state change event
    Pulsor('state:changed').pulse({
      state: newState,
      action,
      timestamp: Date.now()
    })
  })
})

// State validation
const validateState = CreatePulser('state:validate', (state) => {
  const errors = []
  
  // Validate users array
  if (!Array.isArray(state.users)) {
    errors.push('Users must be an array')
  } else {
    state.users.forEach((user, index) => {
      if (!user.id || !user.name || !user.email) {
        errors.push(`User at index ${index} is missing required fields`)
      }
    })
  }
  
  // Validate counter
  if (typeof state.counter !== 'number') {
    errors.push('Counter must be a number')
  }
  
  // Validate settings
  if (!state.settings || typeof state.settings !== 'object') {
    errors.push('Settings must be an object')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    timestamp: Date.now()
  }
})

// State middleware for logging and debugging
const stateMiddleware = CreatePulser('state:middleware', (action, state, changes) => {
  console.group(`🗃️ State Change: ${action}`)
  console.log('Previous State:', state)
  console.log('Changes:', changes)
  console.log('Timestamp:', new Date().toISOString())
  console.groupEnd()
  
  // Validate state after changes
  const validation = validateState.pulse(state)
  if (!validation.valid) {
    console.warn('State validation failed:', validation.errors)
  }
  
  return {
    action,
    valid: validation.valid,
    errors: validation.errors,
    timestamp: Date.now()
  }
})</code></pre>
    </div>

    <!-- Features Overview -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">🔄</div>
        <h3 class="font-semibold text-gray-800 mb-2">Reactive Updates</h3>
        <p class="text-gray-600 text-sm">Automatic UI updates when state changes with Vue's reactivity system integration.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">⏰</div>
        <h3 class="font-semibold text-gray-800 mb-2">Time Travel</h3>
        <p class="text-gray-600 text-sm">Debug with time travel capabilities, state history tracking, and easy state reversion.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">💾</div>
        <h3 class="font-semibold text-gray-800 mb-2">Persistence</h3>
        <p class="text-gray-600 text-sm">Save and restore state across sessions with localStorage and export/import functionality.</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="text-emerald-600 text-2xl mb-3">🔗</div>
        <h3 class="font-semibold text-gray-800 mb-2">Cross-Component</h3>
        <p class="text-gray-600 text-sm">Share state across components with automatic synchronization and event-driven updates.</p>
      </div>
    </div>

    <!-- State Statistics -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">📊 State Statistics</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-emerald-600">{{ stateStats.totalUsers }}</div>
          <div class="text-sm text-gray-600">Total Users</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stateStats.stateChanges }}</div>
          <div class="text-sm text-gray-600">State Changes</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ stateStats.historyEntries }}</div>
          <div class="text-sm text-gray-600">History Entries</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ stateStats.stateSize }}KB</div>
          <div class="text-sm text-gray-600">State Size</div>
        </div>
      </div>
    </div>

    <!-- Activity Log -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">State Activity Log</h2>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div v-for="(log, index) in activityLog" :key="index" 
             class="text-sm font-mono" :class="getLogClass(log.type)">
          {{ log.message }}
        </div>
        <div v-if="activityLog.length === 0" class="text-gray-400 text-sm italic">
          No state activity yet. Start making state changes to see the activity log!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { CreatePulser, Pulsor } from '@/plugins/pulsor/pulsor.js'

// State management
const currentState = reactive({
  users: [],
  counter: 0,
  settings: {
    darkMode: false,
    notifications: true,
    theme: 'light',
    language: 'en'
  },
  lastUpdated: Date.now()
})

const stateHistory = ref([])
const activityLog = ref([])
const activeStateTab = ref('users')

// Form data
const newUser = reactive({
  name: '',
  email: ''
})

// State tabs
const stateTabs = [
  { id: 'users', label: 'Users' },
  { id: 'settings', label: 'Settings' },
  { id: 'raw', label: 'Raw State' },
  { id: 'history', label: 'History' }
]

// Computed statistics
const stateStats = computed(() => {
  const stateSize = Math.round(JSON.stringify(currentState).length / 1024 * 100) / 100
  
  return {
    totalUsers: currentState.users.length,
    stateChanges: stateHistory.value.length,
    historyEntries: stateHistory.value.length,
    stateSize
  }
})

// Setup state management system
const setupStateManagement = () => {
  // State store creator
  CreatePulser('state:store', (initialState = {}) => {
    const state = reactive({ ...initialState, lastUpdated: Date.now() })
    const history = []
    const subscribers = new Set()
    
    return {
      state,
      history,
      subscribers,
      
      getState: () => state,
      
      setState: (updates, action = 'setState') => {
        const previousState = JSON.parse(JSON.stringify(state))
        
        Object.assign(state, updates, { lastUpdated: Date.now() })
        
        history.unshift({
          id: Date.now(),
          action,
          timestamp: Date.now(),
          description: getActionDescription(action, updates),
          previousState,
          currentState: JSON.parse(JSON.stringify(state)),
          changes: updates
        })
        
        if (history.length > 50) {
          history.splice(50)
        }
        
        subscribers.forEach(callback => callback(state, action))
        
        return state
      },
      
      subscribe: (callback) => {
        subscribers.add(callback)
        return () => subscribers.delete(callback)
      },
      
      revert: (historyIndex = 0) => {
        if (history[historyIndex]) {
          const targetState = history[historyIndex].previousState
          Object.assign(state, targetState, { lastUpdated: Date.now() })
          
          history.unshift({
            id: Date.now(),
            action: 'revert',
            timestamp: Date.now(),
            description: `Reverted to state from ${new Date(history[historyIndex].timestamp).toLocaleString()}`,
            changes: targetState
          })
          
          subscribers.forEach(callback => callback(state, 'revert'))
        }
      }
    }
  })
  
  // User management
  CreatePulser('state:users:add', (user) => {
    const newUser = {
      id: Date.now(),
      name: user.name,
      email: user.email,
      createdAt: Date.now()
    }
    
    currentState.users.push(newUser)
    currentState.lastUpdated = Date.now()
    
    addToHistory('addUser', `Added user: ${newUser.name}`, { user: newUser })
    logActivity(`Added user: ${newUser.name}`, 'success')
    
    return newUser
  })
  
  CreatePulser('state:users:remove', (userId) => {
    const userIndex = currentState.users.findIndex(user => user.id === userId)
    if (userIndex !== -1) {
      const removedUser = currentState.users.splice(userIndex, 1)[0]
      currentState.lastUpdated = Date.now()
      
      addToHistory('removeUser', `Removed user: ${removedUser.name}`, { userId })
      logActivity(`Removed user: ${removedUser.name}`, 'warning')
      
      return removedUser
    }
  })
  
  CreatePulser('state:users:clear', () => {
    const userCount = currentState.users.length
    currentState.users.splice(0)
    currentState.lastUpdated = Date.now()
    
    addToHistory('clearUsers', `Cleared all users (${userCount} removed)`, { count: userCount })
    logActivity(`Cleared all users (${userCount} removed)`, 'warning')
  })
  
  // Counter management
  CreatePulser('state:counter:update', (operation, value = 1) => {
    const previousValue = currentState.counter
    
    switch (operation) {
      case 'increment':
        currentState.counter += value
        break
      case 'decrement':
        currentState.counter -= value
        break
      case 'reset':
        currentState.counter = 0
        break
      case 'set':
        currentState.counter = value
        break
    }
    
    currentState.lastUpdated = Date.now()
    
    addToHistory(`counter:${operation}`, `Counter ${operation}: ${previousValue} → ${currentState.counter}`, {
      operation,
      previousValue,
      newValue: currentState.counter
    })
    
    logActivity(`Counter ${operation}: ${previousValue} → ${currentState.counter}`, 'info')
    
    return currentState.counter
  })
  
  // Settings management
  CreatePulser('state:settings:update', (settingUpdates) => {
    const previousSettings = JSON.parse(JSON.stringify(currentState.settings))
    
    Object.assign(currentState.settings, settingUpdates)
    currentState.lastUpdated = Date.now()
    
    const changedKeys = Object.keys(settingUpdates)
    addToHistory('updateSettings', `Updated settings: ${changedKeys.join(', ')}`, {
      previousSettings,
      updates: settingUpdates
    })
    
    logActivity(`Updated settings: ${changedKeys.join(', ')}`, 'info')
    
    return currentState.settings
  })
  
  // State persistence
  CreatePulser('state:save', (key = 'pulsorAppState') => {
    try {
      const serializedState = JSON.stringify(currentState)
      localStorage.setItem(key, serializedState)
      
      logActivity(`State saved to localStorage (${key})`, 'success')
      
      return {
        success: true,
        key,
        size: serializedState.length,
        timestamp: Date.now()
      }
    } catch (error) {
      logActivity(`Failed to save state: ${error.message}`, 'error')
      throw error
    }
  })
  
  CreatePulser('state:load', (key = 'pulsorAppState') => {
    try {
      const serializedState = localStorage.getItem(key)
      
      if (!serializedState) {
        throw new Error(`No saved state found for key: ${key}`)
      }
      
      const savedState = JSON.parse(serializedState)
      
      // Merge saved state with current state
      Object.assign(currentState, savedState, { lastUpdated: Date.now() })
      
      addToHistory('loadState', `Loaded state from localStorage (${key})`, { key })
      logActivity(`State loaded from localStorage (${key})`, 'success')
      
      return {
        success: true,
        key,
        loadedAt: Date.now()
      }
    } catch (error) {
      logActivity(`Failed to load state: ${error.message}`, 'error')
      throw error
    }
  })
  
  CreatePulser('state:export', () => {
    try {
      const stateData = {
        state: currentState,
        history: stateHistory.value,
        exportedAt: Date.now(),
        version: '1.0.0'
      }
      
      const dataStr = JSON.stringify(stateData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `pulsor-state-${Date.now()}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      
      logActivity('State exported to file', 'success')
      
      return {
        success: true,
        filename: link.download,
        size: dataStr.length
      }
    } catch (error) {
      logActivity(`Failed to export state: ${error.message}`, 'error')
      throw error
    }
  })
  
  CreatePulser('state:import', () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      
      input.onchange = (event) => {
        const file = event.target.files[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result)
            
            if (importedData.state) {
              Object.assign(currentState, importedData.state, { lastUpdated: Date.now() })
            }
            
            if (importedData.history) {
              stateHistory.value = importedData.history
            }
            
            addToHistory('importState', `Imported state from file: ${file.name}`, { filename: file.name })
            logActivity(`State imported from file: ${file.name}`, 'success')
          } catch (error) {
            logActivity(`Failed to import state: ${error.message}`, 'error')
          }
        }
        
        reader.readAsText(file)
      }
      
      input.click()
    } catch (error) {
      logActivity(`Failed to import state: ${error.message}`, 'error')
      throw error
    }
  })
}

// State operation functions
const addUser = () => {
  if (!newUser.name.trim() || !newUser.email.trim()) {
    logActivity('Cannot add user: name and email are required', 'error')
    return
  }
  
  Pulsor('state:users:add').pulse({
    name: newUser.name.trim(),
    email: newUser.email.trim()
  })
  
  // Clear form
  newUser.name = ''
  newUser.email = ''
}

const removeUser = (userId) => {
  Pulsor('state:users:remove').pulse(userId)
}

const clearUsers = () => {
  Pulsor('state:users:clear').pulse()
}

const loadSampleUsers = () => {
  const sampleUsers = [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
    { name: 'Bob Johnson', email: 'bob@example.com' },
    { name: 'Alice Brown', email: 'alice@example.com' },
    { name: 'Charlie Wilson', email: 'charlie@example.com' }
  ]
  
  sampleUsers.forEach(user => {
    Pulsor('state:users:add').pulse(user)
  })
  
  logActivity(`Loaded ${sampleUsers.length} sample users`, 'info')
}

const incrementCounter = () => {
  Pulsor('state:counter:update').pulse('increment')
}

const decrementCounter = () => {
  Pulsor('state:counter:update').pulse('decrement')
}

const resetCounter = () => {
  Pulsor('state:counter:update').pulse('reset')
}

const updateSettings = () => {
  Pulsor('state:settings:update').pulse(currentState.settings)
}

const saveState = () => {
  try {
    Pulsor('state:save').pulse()
  } catch (error) {
    // Error already logged in pulser
  }
}

const loadState = () => {
  try {
    Pulsor('state:load').pulse()
  } catch (error) {
    // Error already logged in pulser
  }
}

const exportState = () => {
  try {
    Pulsor('state:export').pulse()
  } catch (error) {
    // Error already logged in pulser
  }
}

const importState = () => {
  try {
    Pulsor('state:import').pulse()
  } catch (error) {
    // Error already logged in pulser
  }
}

const revertToState = (historyIndex) => {
  if (stateHistory.value[historyIndex]) {
    const targetState = stateHistory.value[historyIndex].previousState
    Object.assign(currentState, targetState, { lastUpdated: Date.now() })
    
    addToHistory('revert', `Reverted to state from ${new Date(stateHistory.value[historyIndex].timestamp).toLocaleString()}`, {
      targetTimestamp: stateHistory.value[historyIndex].timestamp
    })
    
    logActivity(`Reverted to previous state`, 'warning')
  }
}

const clearHistory = () => {
  const historyCount = stateHistory.value.length
  stateHistory.value.splice(0)
  logActivity(`Cleared state history (${historyCount} entries)`, 'warning')
}

const copyStateToClipboard = async () => {
  try {
    const stateJson = JSON.stringify(currentState, null, 2)
    await navigator.clipboard.writeText(stateJson)
    logActivity('State copied to clipboard', 'success')
  } catch (error) {
    logActivity(`Failed to copy state: ${error.message}`, 'error')
  }
}

// Utility functions
const addToHistory = (action, description, changes) => {
  stateHistory.value.unshift({
    id: Date.now(),
    action,
    description,
    timestamp: Date.now(),
    changes
  })
  
  // Keep only last 50 entries
  if (stateHistory.value.length > 50) {
    stateHistory.value = stateHistory.value.slice(0, 50)
  }
}

const getActionDescription = (action, updates) => {
  switch (action) {
    case 'addUser': return `Added user: ${updates.user?.name}`
    case 'removeUser': return `Removed user with ID: ${updates.userId}`
    case 'clearUsers': return `Cleared all users (${updates.count} removed)`
    case 'counter:increment': return `Incremented counter: ${updates.previousValue} → ${updates.newValue}`
    case 'counter:decrement': return `Decremented counter: ${updates.previousValue} → ${updates.newValue}`
    case 'counter:reset': return `Reset counter to 0`
    case 'updateSettings': return `Updated settings: ${Object.keys(updates.updates || {}).join(', ')}`
    case 'loadState': return `Loaded state from localStorage (${updates.key})`
    case 'importState': return `Imported state from file: ${updates.filename}`
    case 'revert': return `Reverted to previous state`
    default: return `State updated: ${action}`
  }
}

const getLanguageName = (code) => {
  const languages = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German'
  }
  return languages[code] || code
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
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

const getLogClass = (type) => {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    case 'warning': return 'text-orange-600'
    case 'info': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

// Lifecycle hooks
onMounted(() => {
  setupStateManagement()
  logActivity('State Management demo initialized', 'info')
})

onUnmounted(() => {
  logActivity('State Management demo unmounted', 'info')
})
</script>